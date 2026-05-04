import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import type { Trip } from '@travel/shared';
import { apiFetch } from '../lib/api';

interface Props { onSelectTrip: (id: string) => void; onNewTrip: () => void }

export default function TripsScreen({ onSelectTrip, onNewTrip }: Props) {
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    apiFetch<Trip[]>('/trips').then(setTrips).catch(console.error);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Trips</Text>
        <TouchableOpacity onPress={onNewTrip} style={styles.newBtn}>
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={trips}
        keyExtractor={t => t.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => onSelectTrip(item.id)}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSub}>{item.destination}</Text>
            <Text style={styles.cardDate}>{item.startDate} – {item.endDate}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ color: '#999', marginTop: 24, textAlign: 'center' }}>No trips yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
  newBtn: { backgroundColor: '#0070f3', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 6 },
  newBtnText: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '600' },
  cardSub: { color: '#666', marginTop: 2 },
  cardDate: { color: '#999', fontSize: 13, marginTop: 4 },
});
