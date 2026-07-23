import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SpatialHeader, SpatialScreen } from '@/components/spatial';
import { useSpatialTheme } from '@/components/spatial/useSpatialTheme';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { ApiError, api } from '@/lib/api';
import type { AiChatMessage, AiChatUsage, AiSource } from '@/types/api';

type ChatBubble = AiChatMessage & { id: string; sources?: AiSource[] };

function sourceDisplayName(source: AiSource): string {
  if (source.citation?.trim()) return source.citation.trim();
  if (source.url) {
    try {
      return new URL(source.url).hostname.replace(/^www\./, '');
    } catch {
      /* fall through */
    }
  }
  return source.title;
}

const SUGGESTIONS = [
  'What am I currently taking?',
  'Any interactions I should watch for?',
  'How might my recent doses affect sleep?',
  'Explain my recovery timing in plain language',
];

export default function DosifyAiScreen() {
  const router = useRouter();
  const theme = useSpatialTheme();
  const listRef = useRef<FlatList<ChatBubble>>(null);

  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [usage, setUsage] = useState<AiChatUsage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limitHit, setLimitHit] = useState(false);

  const loadUsage = useCallback(async () => {
    try {
      const next = await api.getAiUsage();
      setUsage(next);
      if (!next.isPremium && (next.remaining ?? 0) <= 0 && next.usedToday > 0) {
        setLimitHit(true);
      }
    } catch {
      // Non-blocking — chat can still attempt and surface errors.
    }
  }, []);

  useEffect(() => {
    void loadUsage();
  }, [loadUsage]);

  const canSend =
    input.trim().length > 0 &&
    !sending &&
    !limitHit &&
    (usage?.aiAvailable !== false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        flex: { flex: 1 },
        listContent: {
          paddingTop: spacing.sm,
          paddingBottom: spacing.lg,
          gap: spacing.sm,
          flexGrow: 1,
        },
        empty: {
          flex: 1,
          justifyContent: 'center',
          gap: spacing.md,
          paddingVertical: spacing.xxl,
        },
        heroIcon: {
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: `${theme.accent}22`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xs,
        },
        emptyTitle: {
          ...typography.h2,
          color: theme.text,
          fontWeight: '700',
        },
        emptyBody: {
          ...typography.body,
          color: theme.textSecondary,
          lineHeight: 22,
          maxWidth: 420,
        },
        suggestions: {
          gap: spacing.sm,
          marginTop: spacing.md,
        },
        suggestion: {
          alignSelf: 'flex-start',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.full,
          backgroundColor: theme.card,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.separator,
        },
        suggestionText: {
          ...typography.caption,
          color: theme.text,
          fontWeight: '500',
        },
        bubbleRow: {
          flexDirection: 'row',
          marginBottom: spacing.sm,
        },
        bubbleRowUser: {
          justifyContent: 'flex-end',
        },
        bubble: {
          maxWidth: '86%',
          borderRadius: radius.lg,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
        },
        bubbleAssistant: {
          backgroundColor: theme.card,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.separator,
          borderBottomLeftRadius: 6,
        },
        bubbleUser: {
          backgroundColor: theme.accent,
          borderBottomRightRadius: 6,
        },
        bubbleText: {
          ...typography.body,
          lineHeight: 22,
        },
        bubbleTextAssistant: {
          color: theme.text,
        },
        bubbleTextUser: {
          color: '#FFFFFF',
        },
        composerWrap: {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.separator,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
          gap: spacing.sm,
        },
        usageRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
        },
        usageText: {
          ...typography.small,
          color: theme.textMuted,
          flex: 1,
        },
        upgradeLink: {
          ...typography.small,
          color: theme.accent,
          fontWeight: '600',
        },
        composer: {
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: spacing.sm,
          backgroundColor: theme.card,
          borderRadius: radius.xl,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.separator,
          paddingLeft: spacing.md,
          paddingRight: spacing.xs,
          paddingVertical: spacing.xs,
        },
        input: {
          flex: 1,
          ...typography.body,
          color: theme.text,
          maxHeight: 120,
          paddingVertical: Platform.OS === 'web' ? 12 : 10,
          outlineStyle: 'none' as never,
        },
        sendBtn: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.accent,
          marginBottom: 2,
        },
        sendBtnDisabled: {
          opacity: 0.4,
        },
        errorBanner: {
          backgroundColor: `${colors.danger}18`,
          borderRadius: radius.md,
          padding: spacing.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: `${colors.danger}44`,
        },
        errorText: {
          ...typography.caption,
          color: colors.danger,
          lineHeight: 18,
        },
        disclaimer: {
          ...typography.small,
          color: theme.textMuted,
          lineHeight: 16,
        },
        typing: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingVertical: spacing.sm,
        },
        typingText: {
          ...typography.caption,
          color: theme.textSecondary,
        },
        sourcesWrap: {
          marginTop: spacing.sm,
          gap: spacing.xs,
          paddingTop: spacing.sm,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.separator,
        },
        sourcesLabel: {
          ...typography.small,
          color: theme.textMuted,
          fontWeight: '700',
          letterSpacing: 0.3,
          textTransform: 'uppercase',
          marginBottom: 2,
        },
        sourceLink: {
          ...typography.caption,
          color: theme.accent,
          fontWeight: '600',
          paddingVertical: 2,
        },
      }),
    [theme]
  );

  const sendMessage = useCallback(
    async (raw: string) => {
      const message = raw.trim();
      if (!message || sending) return;

      setError(null);
      setInput('');
      setSending(true);

      const userBubble: ChatBubble = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: message,
      };
      const nextMessages = [...messages, userBubble];
      setMessages(nextMessages);

      try {
        const history = nextMessages.slice(0, -1).map(({ role, content }) => ({ role, content }));
        const res = await api.askAi({ message, history });
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: res.reply,
            sources: res.sources ?? [],
          },
        ]);
        setUsage(res.usage);
        if (!res.usage.isPremium && (res.usage.remaining ?? 0) <= 0) {
          setLimitHit(true);
        }
      } catch (e) {
        const err = e instanceof ApiError ? e : null;
        const code =
          err?.body && typeof err.body === 'object' && 'code' in err.body
            ? String((err.body as { code?: string }).code)
            : null;

        if (code === 'DAILY_LIMIT' || err?.status === 402) {
          setLimitHit(true);
          if (err?.body && typeof err.body === 'object' && 'usage' in err.body) {
            setUsage((err.body as { usage: AiChatUsage }).usage);
          }
          setError(
            err?.message ??
              'Free plan includes 2 AI questions per day. Upgrade to Dosify Pro for unlimited.'
          );
        } else {
          setError(err?.message ?? 'Could not reach Dosify AI. Is the API running?');
        }
        // Keep the user message so they can retry contextually; optional rollback:
        // setMessages(messages);
      } finally {
        setSending(false);
        requestAnimationFrame(() => {
          listRef.current?.scrollToEnd({ animated: true });
        });
      }
    },
    [messages, sending]
  );

  const usageLabel = usage
    ? usage.isPremium
      ? 'Dosify Pro · unlimited AI'
      : `${usage.remaining ?? 0} of ${usage.limit ?? 2} free questions left today`
    : 'Loading allowance…';

  return (
    <SpatialScreen scroll={false} dockPadding style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <SpatialHeader
          title="Dosify AI"
          showThemeToggle
          showBell={false}
        />

        <FlatList
          ref={listRef}
          style={styles.flex}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.heroIcon}>
                <Ionicons name="sparkles" size={26} color={theme.accent} />
              </View>
              <Text style={styles.emptyTitle}>Ask Dosify AI</Text>
              <Text style={styles.emptyBody}>
                Get plain-language answers about your logged meds, timing, and interaction
                considerations. Not a doctor — informational only.
              </Text>
              <View style={styles.suggestions}>
                {SUGGESTIONS.map((suggestion) => (
                  <Pressable
                    key={suggestion}
                    onPress={() => void sendMessage(suggestion)}
                    style={({ pressed }) => [
                      styles.suggestion,
                      pressed && { opacity: 0.85 },
                    ]}
                    disabled={sending || limitHit}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubbleRow,
                item.role === 'user' && styles.bubbleRowUser,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  item.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    item.role === 'user'
                      ? styles.bubbleTextUser
                      : styles.bubbleTextAssistant,
                  ]}
                >
                  {item.content}
                </Text>
                {item.role === 'assistant' && item.sources && item.sources.length > 0 ? (
                  <View style={styles.sourcesWrap}>
                    <Text style={styles.sourcesLabel}>Sources</Text>
                    {item.sources
                      .filter((source) => Boolean(source.url))
                      .filter((source, index, list) => {
                        const name = sourceDisplayName(source).toLowerCase();
                        return (
                          list.findIndex(
                            (s) => sourceDisplayName(s).toLowerCase() === name
                          ) === index
                        );
                      })
                      .map((source) => (
                        <Pressable
                          key={source.id}
                          onPress={() => void Linking.openURL(source.url!)}
                          style={({ pressed }) => pressed && { opacity: 0.7 }}
                          accessibilityRole="link"
                          accessibilityLabel={`Open ${sourceDisplayName(source)}`}
                        >
                          <Text style={styles.sourceLink} numberOfLines={1}>
                            {sourceDisplayName(source)}
                          </Text>
                        </Pressable>
                      ))}
                  </View>
                ) : null}
              </View>
            </View>
          )}
          ListFooterComponent={
            sending ? (
              <View style={styles.typing}>
                <ActivityIndicator size="small" color={theme.accent} />
                <Text style={styles.typingText}>Dosify AI is thinking…</Text>
              </View>
            ) : null
          }
        />

        <View style={styles.composerWrap}>
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
              {limitHit ? (
                <Pressable
                  onPress={() => router.push('/pricing' as never)}
                  style={{ marginTop: spacing.sm }}
                >
                  <Text style={styles.upgradeLink}>See Dosify Pro →</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <View style={styles.usageRow}>
            <Text style={styles.usageText}>{usageLabel}</Text>
            {usage && !usage.isPremium ? (
              <Pressable onPress={() => router.push('/pricing' as never)}>
                <Text style={styles.upgradeLink}>Upgrade</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask about your meds, timing, interactions…"
              placeholderTextColor={theme.textMuted}
              multiline
              editable={!sending && !limitHit}
              onSubmitEditing={() => {
                if (canSend) void sendMessage(input);
              }}
              blurOnSubmit={false}
            />
            <Pressable
              onPress={() => void sendMessage(input)}
              disabled={!canSend}
              style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
              accessibilityLabel="Send"
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
              )}
            </Pressable>
          </View>

          <Text style={styles.disclaimer}>
            Informational only — not medical advice. Do not change medications based on this chat
            alone.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SpatialScreen>
  );
}
