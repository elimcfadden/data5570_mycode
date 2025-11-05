import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { useSelector } from 'react-redux';

export default function AboutPage() {
  const counter = useSelector((state) => state.counter.value);
  const items = useSelector((state) => state.counter.items);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>About Page</Text>
        
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            This is the About page demonstrating navigation with expo-router.
          </Text>
          
          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>Current State:</Text>
            <Text style={styles.statsText}>Counter Value: {counter}</Text>
            <Text style={styles.statsText}>Total Items: {items.length}</Text>
          </View>

          <Text style={styles.infoText}>
            The Redux store is shared across pages, so the state persists when navigating.
          </Text>
        </View>

        <View style={styles.navigationSection}>
          <Link href="/" asChild>
            <TouchableOpacity style={styles.navButton}>
              <Text style={styles.navButtonText}>Go to Home Page</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  infoSection: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  infoText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 15,
    color: '#333',
  },
  statsSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statsText: {
    fontSize: 16,
    marginBottom: 5,
  },
  navigationSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  navButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  navButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

