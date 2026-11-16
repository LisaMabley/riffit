import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { newPostCopy } from '../copy';
import type { PhotoStatus, PickedPhoto } from '../lib/pickedPhotos';

type Props = {
  photo: PickedPhoto;
  position: number;
  total: number;
  size: number;
  onRetry: () => void;
  onRemove: () => void;
};

// One picked photo in the New post grid, with its upload progress or failure on top.
export function PhotoTile({ photo, position, total, size, onRetry, onRemove }: Props) {
  const statusText = describeStatus(photo.status);

  return (
    <View style={[styles.tile, { width: size, height: size * TILE_ASPECT }]}>
      <Image
        source={{ uri: photo.sourceUri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        accessible
        accessibilityRole="image"
        accessibilityLabel={newPostCopy.photoLabel(position, total, statusText)}
      />

      {/* The image's label already reads out the status, so the overlay text is hidden from
          screen readers. The retry and remove buttons stay reachable. */}
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

      <Pressable
        style={styles.removeButton}
        accessibilityRole="button"
        accessibilityLabel={newPostCopy.removePhoto(position)}
        hitSlop={8}
        onPress={onRemove}
      >
        <Ionicons name="close-circle" size={24} color="#fff" />
      </Pressable>
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
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
});
