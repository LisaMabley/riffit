import * as ImagePicker from 'expo-image-picker';
import { type Dispatch, useReducer, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { PhotoTile } from '../../components/PhotoTile';
import { newPostCopy } from '../../copy';
import {
  type BodyCount,
  describeBodyCount,
  uploadedImageIds,
  whyPostIsBlocked,
} from '../../lib/composePost';
import { createPost } from '../../lib/createPost';
import {
  type MoveDirection,
  type PhotoStatus,
  type PickedPhoto,
  pickedPhotosReducer,
  type PickedPhotosAction,
  remainingPhotoSlots,
} from '../../lib/pickedPhotos';
import { type PreparedPhoto, preparePhoto } from '../../lib/preparePhoto';
import { uploadPhoto } from '../../lib/uploadPhoto';
import type { PostFailure } from '../../lib/postResult';
import type { UploadResult } from '../../lib/uploadResponse';

const GRID_COLUMNS = 3;
const GRID_GAP = 8;
const SCREEN_PADDING = 16;

// Where posting stands. 'posted' shows a confirmation on the emptied form, and a failure keeps
// everything as it was so the person can try again.
type PostingState =
  | { kind: 'editing' }
  | { kind: 'posting' }
  | { kind: 'failed'; failure: PostFailure }
  | { kind: 'posted' };

export default function NewPost() {
  const [photos, dispatch] = useReducer(pickedPhotosReducer, []);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState<PostingState>({ kind: 'editing' });
  const nextPhotoKey = useRef(0);
  const { width: screenWidth } = useWindowDimensions();

  const tileSize =
    (screenWidth - SCREEN_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
  const openSlots = remainingPhotoSlots(photos);
  const bodyCount = describeBodyCount(body);
  const blocker = whyPostIsBlocked(photos, body);
  const isPosting = posting.kind === 'posting';
  const canPost = blocker === null && !isPosting;

  // Starting on a new look clears the last confirmation or failure.
  function changeBody(text: string) {
    setBody(text);
    setPosting({ kind: 'editing' });
  }

  async function submitPost() {
    if (!canPost) {
      return;
    }

    setPosting({ kind: 'posting' });
    const result = await createPost(body, uploadedImageIds(photos));
    if (!result.ok) {
      setPosting({ kind: 'failed', failure: result.failure });
      return;
    }

    dispatch({ type: 'cleared' });
    setBody('');
    setPosting({ kind: 'posted' });
    AccessibilityInfo.announceForAccessibility(newPostCopy.posted);
  }

  async function pickPhotos() {
    setPosting({ kind: 'editing' });

    // On iOS this opens the system photo picker, which needs no photo library permission.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: openSlots,
      orderedSelection: true,
    });
    if (result.canceled) {
      return;
    }

    // selectionLimit isn't supported everywhere, so extra picks are dropped here too.
    const picked: PickedPhoto[] = result.assets.slice(0, openSlots).map((asset) => {
      const key = String(nextPhotoKey.current);
      nextPhotoKey.current += 1;
      return { key, sourceUri: asset.uri, status: { kind: 'preparing' } };
    });
    dispatch({ type: 'added', photos: picked });

    // One photo at a time: each decoded photo holds tens of megabytes of native memory while it's
    // being prepared, and a post can have six.
    for (const photo of picked) {
      await prepareAndUpload(photo, dispatch);
    }
  }

  // The tile can only offer moves that stay in bounds, so the photo always lands next door.
  // VoiceOver's focus stays where it was, so it hears where the photo went.
  function movePhoto(photo: PickedPhoto, index: number, direction: MoveDirection) {
    dispatch({ type: 'moved', key: photo.key, direction });

    const oldPosition = index + 1;
    const newPosition = direction === 'earlier' ? oldPosition - 1 : oldPosition + 1;
    AccessibilityInfo.announceForAccessibility(newPostCopy.movedTo(newPosition, photos.length));
  }

  // One line under the Post button: why posting failed, or why the button is off. Right after
  // posting, the confirmation says enough on its own.
  let postStatusText: string | null = null;
  if (posting.kind === 'failed') {
    postStatusText = newPostCopy.postFailures[posting.failure];
  } else if (blocker !== null && posting.kind === 'editing') {
    postStatusText = newPostCopy.postBlockers[blocker];
  }

  return (
    // Taps go through while the keyboard is up, so Post works on the first tap.
    <ScrollView
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      {posting.kind === 'posted' ? (
        <Text style={styles.postedText}>{newPostCopy.posted}</Text>
      ) : null}

      <View style={styles.grid}>
        {photos.map((photo, index) => (
          <PhotoTile
            key={photo.key}
            photo={photo}
            position={index + 1}
            total={photos.length}
            size={tileSize}
            onRetry={() => prepareAndUpload(photo, dispatch)}
            onRemove={() => dispatch({ type: 'removed', key: photo.key })}
            onMove={(direction) => movePhoto(photo, index, direction)}
          />
        ))}
      </View>

      {photos.length >= 2 ? <Text style={styles.hintText}>{newPostCopy.coverHint}</Text> : null}

      {openSlots > 0 ? (
        <Pressable style={styles.addButton} accessibilityRole="button" onPress={pickPhotos}>
          <Text style={styles.addButtonText}>{newPostCopy.addPhotos}</Text>
        </Pressable>
      ) : (
        <Text style={styles.limitText}>{newPostCopy.photoLimitReached}</Text>
      )}

      <TextInput
        style={styles.bodyInput}
        value={body}
        onChangeText={changeBody}
        placeholder={newPostCopy.bodyPlaceholder}
        placeholderTextColor="#777"
        accessibilityLabel={newPostCopy.bodyLabel}
        multiline
        editable={!isPosting}
      />
      {/* No maxLength: text over the limit stays, so pasted text isn't silently cut off. */}
      <BodyCountText count={bodyCount} />

      <Pressable
        style={[styles.postButton, !canPost && styles.postButtonOff]}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canPost, busy: isPosting }}
        // VoiceOver reads the reason right after "Post, dimmed", without a swipe to the next line.
        accessibilityHint={postStatusText ?? undefined}
        disabled={!canPost}
        onPress={submitPost}
      >
        <Text style={styles.postButtonText}>
          {isPosting ? newPostCopy.posting : newPostCopy.post}
        </Text>
      </Pressable>
      {postStatusText !== null ? (
        <Text
          style={[styles.hintText, posting.kind === 'failed' && styles.failureText]}
          accessibilityRole={posting.kind === 'failed' ? 'alert' : 'text'}
        >
          {postStatusText}
        </Text>
      ) : null}
    </ScrollView>
  );
}

function BodyCountText({ count }: { count: BodyCount }) {
  switch (count.kind) {
    case 'hidden':
      return null;
    case 'remaining':
      return <Text style={styles.hintText}>{newPostCopy.charactersLeft(count.remaining)}</Text>;
    case 'over':
      return (
        <Text style={[styles.hintText, styles.failureText]}>
          {newPostCopy.charactersOver(count.over)}
        </Text>
      );
  }
}

// Prepares a picked photo and uploads it, reporting each step as the photo's status. Also used to
// retry, which starts again from the original so a photo that failed to prepare gets another try.
async function prepareAndUpload(
  photo: Pick<PickedPhoto, 'key' | 'sourceUri'>,
  dispatch: Dispatch<PickedPhotosAction>,
): Promise<void> {
  function setStatus(status: PhotoStatus) {
    dispatch({ type: 'statusChanged', key: photo.key, status });
  }

  setStatus({ kind: 'preparing' });
  let prepared: PreparedPhoto;
  try {
    prepared = await preparePhoto(photo.sourceUri);
  } catch (error) {
    console.warn(`Couldn't prepare a photo: ${String(error)}`);
    setStatus({ kind: 'failed', failure: 'unreadable' });
    return;
  }

  setStatus({ kind: 'uploading' });
  let result: UploadResult;
  try {
    result = await uploadPhoto(prepared);
  } catch (error) {
    // uploadPhoto reports failures as results, so this is something like the prepared file
    // having gone missing from the cache.
    console.warn(`Photo upload threw: ${String(error)}`);
    result = { ok: false, failure: 'unexpected' };
  }

  if (!result.ok) {
    console.warn(`Photo upload failed: ${result.failure}`);
    setStatus({ kind: 'failed', failure: result.failure });
    return;
  }
  setStatus({ kind: 'done', imageId: result.imageId });
}

const styles = StyleSheet.create({
  screen: {
    padding: SCREEN_PADDING,
    gap: 16,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  addButton: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#111',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  limitText: {
    textAlign: 'center',
  },
  hintText: {
    color: '#555',
    fontSize: 13,
  },
  failureText: {
    color: '#b00020',
  },
  postedText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  bodyInput: {
    minHeight: 96,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    fontSize: 15,
    textAlignVertical: 'top',
  },
  postButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: '#111',
  },
  // Gray rather than faded, so the button is clearly off without looking broken.
  postButtonOff: {
    backgroundColor: '#999',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
