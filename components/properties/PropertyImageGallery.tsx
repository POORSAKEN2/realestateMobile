import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  Animated,
  Image,
  PanResponder,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const DOUBLE_TAP_DELAY = 260;
const ZOOM_SCALE = 2;

function ZoomableImage({
  image,
  label,
  onZoomChange,
}: {
  image: string;
  label: string;
  onZoomChange: (isZoomed: boolean) => void;
}) {
  const lastTapAt = useRef(0);
  const scale = useRef(new Animated.Value(1)).current;
  const translation = useRef(new Animated.ValueXY()).current;
  const panOffset = useRef({ x: 0, y: 0 });
  const isZoomedRef = useRef(false);
  const viewport = useRef({ width: 0, height: 0 });
  const [isZoomed, setIsZoomed] = useState(false);

  const getBounds = () => ({
    x: (viewport.current.width * (ZOOM_SCALE - 1)) / 2,
    y: (viewport.current.height * (ZOOM_SCALE - 1)) / 2,
  });
  const clampTranslation = (value: number, axis: "x" | "y") => {
    const limit = getBounds()[axis];
    return Math.max(-limit, Math.min(limit, value));
  };
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        isZoomedRef.current &&
        (Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2),
      onPanResponderMove: (_, gesture) => {
        translation.setValue({
          x: clampTranslation(panOffset.current.x + gesture.dx, "x"),
          y: clampTranslation(panOffset.current.y + gesture.dy, "y"),
        });
      },
      onPanResponderRelease: (_, gesture) => {
        panOffset.current = {
          x: clampTranslation(panOffset.current.x + gesture.dx, "x"),
          y: clampTranslation(panOffset.current.y + gesture.dy, "y"),
        };
      },
      onPanResponderTerminate: () => {
        translation.setValue(panOffset.current);
      },
    }),
  ).current;

  function toggleZoom() {
    const nextZoomed = !isZoomed;
    isZoomedRef.current = nextZoomed;
    setIsZoomed(nextZoomed);
    onZoomChange(nextZoomed);

    if (!nextZoomed) {
      panOffset.current = { x: 0, y: 0 };
      Animated.spring(translation, {
        toValue: panOffset.current,
        useNativeDriver: true,
      }).start();
    }

    Animated.spring(scale, {
      toValue: nextZoomed ? ZOOM_SCALE : 1,
      useNativeDriver: true,
    }).start();
  }

  function handlePress() {
    const now = Date.now();
    if (now - lastTapAt.current < DOUBLE_TAP_DELAY) {
      lastTapAt.current = 0;
      toggleZoom();
      return;
    }

    lastTapAt.current = now;
  }

  return (
    <View
      className="flex-1 overflow-hidden"
      onLayout={(event) => {
        viewport.current = event.nativeEvent.layout;
      }}
      {...panResponder.panHandlers}
    >
      <Pressable
        accessibilityHint={
          isZoomed
            ? "Drag to move the image. Double tap to reset zoom"
            : "Double tap to zoom the image"
        }
        accessibilityLabel={label}
        accessibilityRole="imagebutton"
        className="flex-1"
        onPress={handlePress}
      >
        <Animated.Image
          className="h-full w-full"
          resizeMode="contain"
          source={{ uri: image }}
          style={{
            transform: [
              { translateX: translation.x },
              { translateY: translation.y },
              { scale },
            ],
          }}
        />
      </Pressable>
    </View>
  );
}

export default function PropertyImageGallery({
  images,
  title,
  visible,
  onClose,
}: {
  images: string[];
  title: string;
  visible: boolean;
  onClose: () => void;
}) {
  const [galleryWidth, setGalleryWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomedImageIndex, setZoomedImageIndex] = useState<number | null>(null);

  function handleClose() {
    setZoomedImageIndex(null);
    onClose();
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View className="flex-1 bg-[#09090B]">
        <View className="absolute left-5 right-5 top-14 z-10 flex-row items-center justify-between gap-3">
          <View className="min-w-0 flex-1 rounded-2xl bg-black/45 px-4 py-3">
            <Text className="text-base font-bold text-white" numberOfLines={1}>
              {title}
            </Text>
            <Text className="mt-0.5 text-xs font-medium text-white/65">
              {images.length
                ? `${activeIndex + 1} of ${images.length}`
                : "No images"}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            accessibilityLabel="Close image gallery"
            accessibilityRole="button"
            className="h-12 w-12 items-center justify-center rounded-2xl bg-white/15"
            onPress={handleClose}
          >
            <MaterialCommunityIcons name="close" color="#FFFFFF" size={24} />
          </TouchableOpacity>
        </View>

        <View
          className="flex-1"
          onLayout={(event) => setGalleryWidth(event.nativeEvent.layout.width)}
        >
          <ScrollView
            horizontal
            onMomentumScrollEnd={(event) => {
              if (!galleryWidth) return;
              setActiveIndex(
                Math.round(event.nativeEvent.contentOffset.x / galleryWidth),
              );
            }}
            pagingEnabled
            scrollEventThrottle={16}
            scrollEnabled={zoomedImageIndex === null}
            showsHorizontalScrollIndicator={false}
          >
            {images.map((image, index) => (
              <View
                className="flex-1 py-24"
                key={`${image}:gallery:${index}:${visible ? "visible" : "hidden"}`}
                style={{ width: galleryWidth || 1 }}
              >
                <ZoomableImage
                  image={image}
                  label={`${title}, image ${index + 1}`}
                  onZoomChange={(isZoomed) =>
                    setZoomedImageIndex((current) =>
                      isZoomed ? index : current === index ? null : current,
                    )
                  }
                />
              </View>
            ))}
          </ScrollView>
        </View>

        <View className="absolute bottom-10 left-5 right-5 items-center gap-3">
          <View className="rounded-full bg-white/10 px-4 py-2">
            <Text className="text-xs font-semibold text-white/80">
              Double tap image to zoom
            </Text>
          </View>
          {images.length > 1 ? (
            <View className="flex-row items-center gap-1.5 rounded-full bg-black/45 px-3 py-2.5">
              {images.map((image, index) => (
                <View
                  className={`rounded-full ${
                    index === activeIndex
                      ? "h-2 w-5 bg-white"
                      : "h-2 w-2 bg-white/40"
                  }`}
                  key={`${image}:gallery-dot:${index}`}
                />
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
