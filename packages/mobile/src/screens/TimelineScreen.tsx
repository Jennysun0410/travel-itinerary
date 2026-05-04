import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SectionList } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import type { Order, TimelineSlot } from '@travel/shared';
import { apiFetch } from '../lib/api';

type SlottedOrder = TimelineSlot & { order: Order };
type TimelineByDay = Record<string, SlottedOrder[]>;

interface Props { tripId: string }

export default function TimelineScreen({ tripId }: Props) {
  const [timeline, setTimeline] = useState<TimelineByDay>({});
  const [unscheduled, setUnscheduled] = useState<Order[]>([]);
  const [days, setDays] = useState<string[]>([]);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadTimeline = useCallback(async () => {
    const [tl, orders] = await Promise.all([
      apiFetch<TimelineByDay>(`/timeline/trips/${tripId}/timeline`),
      apiFetch<Order[]>(`/orders/trips/${tripId}/orders`),
    ]);
    setTimeline(tl);
    const scheduledIds = new Set(Object.values(tl).flatMap(slots => slots.map(s => s.orderId)));
    setUnscheduled(orders.filter(o => !scheduledIds.has(o.id)));
  }, [tripId]);

  useEffect(() => {
    apiFetch<{ startDate: string; endDate: string }>(`/trips/${tripId}`).then(trip => {
      const d: string[] = [];
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
        d.push(dt.toISOString().slice(0, 10));
      }
      setDays(d);
    });
    loadTimeline();
    pollingRef.current = setInterval(loadTimeline, 5000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [tripId, loadTimeline]);

  const handlePlaceOnDay = async (order: Order, day: string) => {
    setUnscheduled(u => u.filter(o => o.id !== order.id));
    await apiFetch(`/timeline/trips/${tripId}/timeline`, {
      method: 'POST',
      body: JSON.stringify({ order_id: order.id, day }),
    });
    loadTimeline();
  };

  const handleRemoveFromTimeline = async (slotId: string) => {
    await apiFetch(`/timeline/${slotId}`, { method: 'DELETE' });
    loadTimeline();
  };

  const handleReorder = async (day: string, data: SlottedOrder[]) => {
    setTimeline(t => ({ ...t, [day]: data }));
    await Promise.all(data.map((slot, idx) =>
      apiFetch(`/timeline/${slot.id}`, { method: 'PATCH', body: JSON.stringify({ position: idx }) }),
    ));
  };

  const sections = days.map(day => ({
    title: day,
    data: [{ day, slots: timeline[day] ?? [] }],
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Timeline</Text>

      {/* Unscheduled pool */}
      {unscheduled.length > 0 && (
        <View style={styles.pool}>
          <Text style={styles.sectionTitle}>Unscheduled</Text>
          <FlatList
            horizontal
            data={unscheduled}
            keyExtractor={o => o.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.poolCard} onLongPress={() => {}}>
                <Text style={styles.poolCardText}>{item.vendor}</Text>
                <Text style={styles.poolCardSub}>{item.type}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Timeline by day */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.day}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.dayHeader}>{title}</Text>
        )}
        renderItem={({ item }) => (
          <View>
            <DraggableFlatList
              data={item.slots}
              keyExtractor={s => s.id}
              onDragEnd={({ data }) => handleReorder(item.day, data)}
              renderItem={({ item: slot, drag, isActive }: RenderItemParams<SlottedOrder>) => (
                <ScaleDecorator>
                  <TouchableOpacity onLongPress={drag} style={[styles.slotCard, isActive && { opacity: 0.7 }]}>
                    <Text style={styles.slotTitle}>{slot.order.vendor}</Text>
                    <Text style={styles.slotSub}>by {slot.placedByName}</Text>
                    <TouchableOpacity onPress={() => handleRemoveFromTimeline(slot.id)} style={styles.removeBtn}>
                      <Text style={{ color: '#999' }}>×</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </ScaleDecorator>
              )}
              ListEmptyComponent={() => (
                <View style={styles.emptyDay}>
                  {unscheduled.slice(0, 3).map(o => (
                    <TouchableOpacity key={o.id} onPress={() => handlePlaceOnDay(o, item.day)} style={styles.addToDay}>
                      <Text style={{ fontSize: 12 }}>+ {o.vendor}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 22, fontWeight: 'bold', padding: 16 },
  pool: { paddingHorizontal: 16, paddingBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 6 },
  poolCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 10, marginRight: 8, minWidth: 100 },
  poolCardText: { fontSize: 13, fontWeight: '600' },
  poolCardSub: { fontSize: 11, color: '#999' },
  dayHeader: { fontSize: 14, fontWeight: '700', color: '#333', backgroundColor: '#f5f5f5', padding: '8px 16px' as unknown as number, paddingHorizontal: 16, paddingVertical: 8 },
  slotCard: { backgroundColor: '#eef4ff', borderWidth: 1, borderColor: '#b3d4ff', borderRadius: 6, padding: 10, marginHorizontal: 16, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between' },
  slotTitle: { fontSize: 13, fontWeight: '600' },
  slotSub: { fontSize: 11, color: '#888' },
  removeBtn: { padding: 4 },
  emptyDay: { paddingHorizontal: 16, paddingVertical: 4, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  addToDay: { backgroundColor: '#f0f0f0', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
});
