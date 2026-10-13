import { Image } from 'expo-image';
import { Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

import { AppText } from '@/src/components/ui/AppText';
import { Avatar } from '@/src/components/ui/Avatar';
import { Badge } from '@/src/components/ui/Badge';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/States';
import { Segmented } from '@/src/components/ui/Segmented';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { covers } from '@/src/data/images';
import { eventById, loc, personById, posts, venueById } from '@/src/data/demo';
import { formatDayLabel } from '@/src/lib/format';
import { useAppStore } from '@/src/stores/appStore';
import { colors, fonts, radii, tabClearance } from '@/src/theme/tokens';

type FeedTab = 'forYou' | 'nearby' | 'prefs';

export function FeedScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const city = useAppStore((state) => state.city);
  const genres = useAppStore((state) => state.genres);
  const localPosts = useAppStore((state) => state.posts);
  const addPost = useAppStore((state) => state.addPost);
  const [tab, setTab] = useState<FeedTab>('forYou');
  const [composeOpen, setComposeOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [storyId, setStoryId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});

  const sample = useMemo(() => {
    return posts.filter((post) => {
      const event = eventById(post.eventId);
      const venue = event ? venueById(event.venueId) : undefined;
      if (!event || !venue) return false;
      if (tab === 'nearby' && venue.city !== city) return false;
      if (tab === 'prefs' && !event.genres.some((genre) => genres.includes(genre))) return false;
      return true;
    });
  }, [city, genres, tab]);

  const stories = sample.filter((post) => post.story);
  const story = stories.find((post) => post.id === storyId) ?? null;
  const localVisible = localPosts.filter((post) => tab !== 'nearby' || post.city === city);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: tabClearance + 24, paddingHorizontal: 16, gap: 16 }}>
        <AppText variant="muted">{formatDayLabel(new Date().toISOString().slice(0, 10), i18n.language)}</AppText>
        <View style={styles.titleRow}>
          <AppText variant="display" style={styles.title}>
            {t('feed.title', { city: t(`cities.${city}In`) })}
          </AppText>
          <Pressable accessibilityRole="button" accessibilityLabel={t('feed.composeTitle')} onPress={() => setComposeOpen(true)} style={styles.plus}>
            <Plus color={colors.accentInk} size={22} />
          </Pressable>
        </View>
        <Segmented
          value={tab}
          onChange={(id) => setTab(id as FeedTab)}
          values={[
            { id: 'forYou', label: t('feed.forYou') },
            { id: 'nearby', label: t('feed.nearby') },
            { id: 'prefs', label: t('feed.prefs') },
          ]}
        />
        <View style={styles.storyHeader}>
          <AppText variant="bodyMedium">{t('feed.stories')}</AppText>
          <AppText variant="muted">{t('feed.newPosts')}</AppText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stories}>
          {stories.map((post) => {
            const author = personById(post.authorId);
            return (
              <Pressable key={post.id} accessibilityRole="button" onPress={() => setStoryId(post.id)} style={styles.story}>
                <Avatar name={author?.name ?? ''} portrait={author?.portrait} size={64} />
                <AppText variant="muted">{author?.name.split(' ')[0]}</AppText>
              </Pressable>
            );
          })}
        </ScrollView>
        {localVisible.length === 0 && sample.length === 0 ? (
          <EmptyState title={t('feed.emptyTitle')} body={t('feed.emptyBody')} />
        ) : null}
        {localVisible.map((post) => (
          <Card key={post.id}>
            <Badge label={t('feed.localBadge')} tone="accent" />
            <AppText variant="body" style={styles.caption}>
              {post.caption}
            </AppText>
          </Card>
        ))}
        {sample.map((post) => {
          const author = personById(post.authorId);
          const event = eventById(post.eventId);
          const venue = event ? venueById(event.venueId) : undefined;
          return (
            <Pressable key={post.id} accessibilityRole="button" onPress={() => event && router.push(`/event/${event.id}`)}>
              <Card style={styles.post}>
                <View style={styles.author}>
                  <Avatar name={author?.name ?? ''} portrait={author?.portrait} />
                  <View style={styles.authorText}>
                    <AppText variant="bodyMedium">{author?.name}</AppText>
                    <AppText variant="muted">{t('feed.ago', { count: post.minutesAgo })}</AppText>
                  </View>
                  <Badge label={t('feed.sampleBadge')} />
                </View>
                <View style={styles.media}>
                  {!loaded[post.id] ? <Skeleton style={StyleSheet.absoluteFill} /> : null}
                  <Image source={covers[post.cover]} style={styles.image} contentFit="cover" onLoad={() => setLoaded((current) => ({ ...current, [post.id]: true }))} />
                </View>
                <AppText variant="body">{loc(post.caption, i18n.language)}</AppText>
                {event && venue ? (
                  <AppText variant="muted">
                    {event.title} · {venue.name}
                  </AppText>
                ) : null}
              </Card>
            </Pressable>
          );
        })}
      </ScrollView>

      <BottomSheet visible={composeOpen} title={t('feed.composeTitle')} onClose={() => setComposeOpen(false)}>
        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder={t('feed.composePlaceholder')}
          placeholderTextColor={colors.textFaint}
          style={styles.compose}
          multiline
          accessibilityLabel={t('feed.composePlaceholder')}
        />
        <Button
          label={t('feed.composeAction')}
          disabled={caption.trim().length < 2}
          onPress={() => {
            addPost(caption.trim());
            setCaption('');
            setComposeOpen(false);
          }}
        />
      </BottomSheet>

      {story ? (
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={() => setStoryId(null)} style={styles.storyViewer}>
          <Image source={covers[story.cover]} style={styles.storyImage} contentFit="cover" />
          <AppText variant="body" style={styles.storyCaption}>
            {loc(story.caption, i18n.language)}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  title: { flex: 1 },
  plus: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  storyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stories: { gap: 14 },
  story: { alignItems: 'center', gap: 6, width: 72 },
  post: { gap: 12, padding: 12 },
  author: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorText: { flex: 1 },
  media: { height: 360, borderRadius: radii.lg, overflow: 'hidden', backgroundColor: colors.surface2 },
  image: { width: '100%', height: '100%' },
  caption: { marginTop: 8 },
  compose: {
    minHeight: 96,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 16,
    padding: 12,
    textAlignVertical: 'top',
  },
  storyViewer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.bg, justifyContent: 'flex-end' },
  storyImage: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  storyCaption: { padding: 24, paddingBottom: tabClearance, backgroundColor: 'rgba(7,6,12,0.55)' },
});
