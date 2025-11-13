import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'expo-router';
import { fetchCustomers } from '../store/customerSlice';

export default function HomePage() {
  const dispatch = useDispatch();
  const { customers, loading, error } = useSelector((state) => state.customers);

  useEffect(() => {
    // Fetch customers when component mounts
    dispatch(fetchCustomers());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchCustomers());
  };

  if (error) {
    Alert.alert('Error', `Failed to load customers: ${error}`, [
      { text: 'Retry', onPress: handleRefresh },
      { text: 'OK' },
    ]);
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Customer Management</Text>
        
        {/* Header Actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={handleRefresh}
            disabled={loading}
          >
            <Text style={styles.refreshButtonText}>
              {loading ? 'Loading...' : 'Refresh'}
            </Text>
          </TouchableOpacity>
          <Link href="/add-customer" asChild>
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addButtonText}>Add Customer</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Loading State */}
        {loading && customers.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading customers...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={handleRefresh}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Customers List */}
        {!loading && customers.length === 0 && !error && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No customers found.</Text>
            <Text style={styles.emptySubtext}>Add your first customer to get started!</Text>
          </View>
        )}

        {customers.length > 0 && (
          <View style={styles.customersSection}>
            <Text style={styles.sectionTitle}>Customers ({customers.length})</Text>
            {customers.map((customer) => (
              <View key={customer.id} style={styles.customerCard}>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>
                    {customer.first_name} {customer.last_name}
                  </Text>
                  <Text style={styles.customerEmail}>{customer.email}</Text>
                  {customer.phone_number && (
                    <Text style={styles.customerPhone}>{customer.phone_number}</Text>
                  )}
                  <Text style={styles.customerDate}>
                    Added: {new Date(customer.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Navigation Link */}
        <View style={styles.navigationSection}>
          <Link href="/about" asChild>
            <TouchableOpacity style={styles.navButton}>
              <Text style={styles.navButtonText}>Go to About Page</Text>
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
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  refreshButton: {
    flex: 1,
    backgroundColor: '#34C759',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#c62828',
    fontSize: 16,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#c62828',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  customersSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  customerCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  customerEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  customerDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  navigationSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  navButton: {
    backgroundColor: '#34C759',
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
