import { Feather, Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { colors } from "../../constants/colors";
import type { FAQItem } from "../../types/domain/support";

export function FaqAccordion({ faq }: { faq: FAQItem }) {
  const [isOpen, setIsOpen] = useState(false);

  const question = faq.question || faq.title || "Help topic";
  const answer = faq.answer || faq.content || "";

  return (
    <View className="mb-2.5 overflow-hidden rounded-2xl border border-primary/15 bg-white shadow-sm shadow-primary/5">
      <TouchableOpacity
        activeOpacity={0.8}
        className="flex-row items-center justify-between p-4"
        onPress={() => setIsOpen((prev) => !prev)}
      >
        <View className="flex-1 pr-3 flex-row items-center gap-2.5">
          <Feather name="help-circle" size={16} color={colors.primary} />
          <Text className="flex-1 font-ralewayBold text-sm text-textPrimary">
            {question}
          </Text>
        </View>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.description}
        />
      </TouchableOpacity>

      {isOpen ? (
        <View className="border-t border-primary/10 bg-surface px-4 py-3.5">
          <Text className="font-ralewayMedium text-xs leading-5 text-textPrimary">
            {answer}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
