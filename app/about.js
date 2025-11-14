import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { useSelector } from 'react-redux';

export default function AboutPage() {
  const { customers, loading } = useSelector((state) => state.customers);
  const counter = useSelector((state) => state.counter.value);

  // Calculate statistics
  const totalCustomers = customers.length;
  const customersWithPhone = customers.filter((c) => c.phone_number).length;
  const recentCustomers = customers.filter((c) => {
    const createdDate = new Date(c.created_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return createdDate >= sevenDaysAgo;
  }).length;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>About This App</Text>
        
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            This is a full-stack customer management application built with:
          </Text>
          <View style={styles.techList}>
            <Text style={styles.techItem}>• React Native (Expo)</Text>
            <Text style={styles.techItem}>• Redux Toolkit</Text>
            <Text style={styles.techItem}>• Django REST Framework</Text>
            <Text style={styles.techItem}>• SQLite Database</Text>
          </View>
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Application Statistics</Text>
          
          {loading ? (
            <Text style={styles.loadingText}>Loading statistics...</Text>
          ) : (
            <>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Customers</Text>
                <Text style={styles.statValue}>{totalCustomers}</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Customers with Phone</Text>
                <Text style={styles.statValue}>{customersWithPhone}</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Recent Customers (7 days)</Text>
                <Text style={styles.statValue}>{recentCustomers}</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Counter Value</Text>
                <Text style={styles.statValue}>{counter}</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Features</Text>
          <View style={styles.featuresList}>
            <Text style={styles.featureItem}>✓ View all customers (GET request)</Text>
            <Text style={styles.featureItem}>✓ Add new customers (POST request)</Text>
            <Text style={styles.featureItem}>✓ Responsive UI design</Text>
            <Text style={styles.featureItem}>✓ State management with Redux</Text>
            <Text style={styles.featureItem}>✓ Real-time data updates</Text>
            <Text style={styles.featureItem}>✓ Error handling and validation</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            The Redux store is shared across all pages, so customer data persists when navigating.
            All data is fetched from and saved to the Django backend API.
          </Text>
        </View>

        <View style={styles.navigationSection}>
          <Link href="/" asChild>
            <TouchableOpacity style={styles.navButton}>
              <Text style={styles.navButtonText}>Go to Home Page</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/add-customer" asChild>
            <TouchableOpacity style={styles.addCustomerButton}>
              <Text style={styles.navButtonText}>Add Customer</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  infoSection: {
    marginBottom: 25,
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
  techList: {
    marginTop: 10,
  },
  techItem: {
    fontSize: 16,
    lineHeight: 28,
    color: '#666',
  },
  statsSection: {
    marginBottom: 25,
    padding: 20,
    backgroundColor: '#e8f4f8',
    borderRadius: 10,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  featuresSection: {
    marginBottom: 25,
    padding: 20,
    backgroundColor: '#f0f8f0',
    borderRadius: 10,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  featuresList: {
    marginTop: 10,
  },
  featureItem: {
    fontSize: 16,
    lineHeight: 28,
    color: '#333',
    marginBottom: 5,
  },
  navigationSection: {
    marginTop: 20,
    alignItems: 'center',
    gap: 10,
  },
  navButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#34C759',
  },
  addCustomerButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  navButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
