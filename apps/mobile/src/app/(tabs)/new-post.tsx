import * as ImagePicker from 'expo-image-picker';
import { type Dispatch, useReducer, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { PhotoTile } from '../../components/PhotoTile';
import { newPostCopy } from '../../copy';
import {
  type PhotoStatus,
  type PickedPhoto,
  pickedPhotosReducer,
  type PickedPhotosAction,
  remainingPhotoSlots,
} from '../../lib/pickedPhotos';
import { type PreparedPhoto, preparePhoto } from '../../lib/preparePhoto';
import { uploadPhoto } from '../../lib/uploadPhoto';
import type { UploadResult } from '../../lib/uploadResponse';

const GRID_COLUMNS = 3;
const GRID_GAP = 8;
const SCREEN_PADDING = 16;

export default function NewPost() {
  const [photos, dispatch] = useReducer(pickedPhotosReducer, []);
  const nextPhotoKey = useRef(0);
  const { width: screenWidth } = useWindowDimensions();

  const tileSize =
    (screenWidth - SCREEN_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
  const openSlots = remainingPhotoSlots(photos);

  async function pickPhotos() {
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

  return (
    <ScrollView contentContainerStyle={styles.screen}>
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
          />
        ))}
      </View>

      {openSlots > 0 ? (
        <Pressable style={styles.addButton} accessibilityRole="button" onPress={pickPhotos}>
          <Text style={styles.addButtonText}>{newPostCopy.addPhotos}</Text>
        </Pressable>
      ) : (
        <Text style={styles.limitText}>{newPostCopy.photoLimitReached}</Text>
      )}
    </ScrollView>
  );
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
});
