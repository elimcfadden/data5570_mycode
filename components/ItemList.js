import { View, Text, StyleSheet } from 'react-native';
import ItemCard from './ItemCard';

// Parent component that renders multiple ItemCard children
export default function ItemList({ items, onRemoveItem }) {
  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No items yet. Add some items!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Items List:</Text>
      {items.map((item, index) => (
        <ItemCard
          key={index}
          item={item}
          index={index}
          onRemove={onRemoveItem}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
});

