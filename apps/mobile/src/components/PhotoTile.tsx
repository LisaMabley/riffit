import { Ionicons } from '@expo/vector-icons';
import {
  type AccessibilityActionEvent,
  type AccessibilityActionInfo,
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { newPostCopy } from '../copy';
import type { MoveDirection, PhotoStatus, PickedPhoto } from '../lib/pickedPhotos';

type Props = {
  photo: PickedPhoto;
  position: number;
  total: number;
  size: number;
  onRetry: () => void;
  onRemove: () => void;
  onMove: (direction: MoveDirection) => void;
};

// One picked photo in the New post grid, with its upload progress or failure on top, and buttons
// to remove it or move it.
export function PhotoTile({ photo, position, total, size, onRetry, onRemove, onMove }: Props) {
  const statusText = describeStatus(photo.status);
  const isCover = position === 1;
  const canMoveEarlier = position > 1;
  const canMoveLater = position < total;

  // The same moves as the arrow buttons, offered in VoiceOver's actions on the photo, so someone
  // can reorder without leaving the image.
  const moveActions: AccessibilityActionInfo[] = [];
  if (canMoveEarlier) {
    moveActions.push({ name: 'earlier', label: newPostCopy.moveEarlierAction });
  }
  if (canMoveLater) {
    moveActions.push({ name: 'later', label: newPostCopy.moveLaterAction });
  }

  function handleAccessibilityAction(event: AccessibilityActionEvent) {
    const actionName = event.nativeEvent.actionName;
    if (actionName === 'earlier' || actionName === 'later') {
      onMove(actionName);
    }
  }

  return (
    <View style={[styles.tile, { width: size, height: size * TILE_ASPECT }]}>
      <Image
        source={{ uri: photo.sourceUri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        accessible
        accessibilityRole="image"
        accessibilityLabel={newPostCopy.photoLabel(position, total, statusText)}
        accessibilityActions={moveActions}
        onAccessibilityAction={handleAccessibilityAction}
      />

      {/* The image's label already reads out the status and the cover, so the overlay text and
          the cover label are hidden from screen readers. The buttons stay reachable. */}
      {photo.status.kind === 'preparing' || photo.status.kind === 'uploading' ? (
        <View style={styles.overlay}>
          <ActivityIndicator color="#fff" />
          <Text
            style={styles.overlayText}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            {statusText}
          </Text>
        </View>
      ) : null}

      {photo.status.kind === 'failed' ? (
        <View style={styles.overlay}>
          <Text
            style={styles.overlayText}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            {statusText}
          </Text>
          <Pressable style={styles.retryButton} accessibilityRole="button" onPress={onRetry}>
            <Text style={styles.retryText}>{newPostCopy.tryAgain}</Text>
          </Pressable>
        </View>
      ) : null}

      {isCover ? (
        <View style={styles.coverLabel} accessibilityElementsHidden importantForAccessibility="no">
          <Text style={styles.coverText}>{newPostCopy.cover}</Text>
        </View>
      ) : null}

      <Pressable
        style={styles.removeButton}
        accessibilityRole="button"
        accessibilityLabel={newPostCopy.removePhoto(position)}
        hitSlop={8}
        onPress={onRemove}
      >
        <Ionicons name="close-circle" size={ICON_SIZE} color="#fff" />
      </Pressable>

      {/* Earlier is left, matching the grid's reading order. */}
      {canMoveEarlier ? (
        <Pressable
          style={[styles.moveButton, styles.moveEarlierButton]}
          accessibilityRole="button"
          accessibilityLabel={newPostCopy.movePhotoEarlier(position)}
          hitSlop={8}
          onPress={() => onMove('earlier')}
        >
          <Ionicons name="chevron-back-circle" size={ICON_SIZE} color="#fff" />
        </Pressable>
      ) : null}

      {canMoveLater ? (
        <Pressable
          style={[styles.moveButton, styles.moveLaterButton]}
          accessibilityRole="button"
          accessibilityLabel={newPostCopy.movePhotoLater(position)}
          hitSlop={8}
          onPress={() => onMove('later')}
        >
          <Ionicons name="chevron-forward-circle" size={ICON_SIZE} color="#fff" />
        </Pressable>
      ) : null}
    </View>
  );
}

function describeStatus(status: PhotoStatus): string {
  switch (status.kind) {
    case 'preparing':
      return newPostCopy.preparing;
    case 'uploading':
      return newPostCopy.uploading;
    case 'done':
      return newPostCopy.ready;
    case 'failed':
      return newPostCopy.photoFailures[status.failure];
  }
}

// Tiles are 3:4 portrait, close to how most outfit photos are shot.
const TILE_ASPECT = 4 / 3;
const ICON_SIZE = 24;
const BUTTON_INSET = 4;

const styles = StyleSheet.create({
  tile: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#eee',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  overlayText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  retryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  coverLabel: {
    position: 'absolute',
    top: BUTTON_INSET,
    left: BUTTON_INSET,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  coverText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    position: 'absolute',
    top: BUTTON_INSET,
    right: BUTTON_INSET,
  },
  moveButton: {
    position: 'absolute',
    bottom: BUTTON_INSET,
  },
  moveEarlierButton: {
    left: BUTTON_INSET,
  },
  moveLaterButton: {
    right: BUTTON_INSET,
  },
});
