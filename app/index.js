import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'expo-router';
import { increment, decrement, incrementByAmount, addItem, removeItem } from '../store/counterSlice';
import ItemList from '../components/ItemList';

export default function HomePage() {
  const [inputValue, setInputValue] = useState('');
  const [inputAmount, setInputAmount] = useState('');
  const counter = useSelector((state) => state.counter.value);
  const items = useSelector((state) => state.counter.items);
  const dispatch = useDispatch();

  // useEffect hook to demonstrate React hooks usage
  useEffect(() => {
    console.log('Counter value changed:', counter);
  }, [counter]);

  const handleAddItem = () => {
    if (inputValue.trim()) {
      dispatch(addItem(inputValue.trim()));
      setInputValue('');
    }
  };

  const handleRemoveItem = (index) => {
    dispatch(removeItem(index));
  };

  const handleIncrementByAmount = () => {
    const amount = parseInt(inputAmount) || 0;
    dispatch(incrementByAmount(amount));
    setInputAmount('');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Home Page</Text>
        
        {/* Counter Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Counter: {counter}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => dispatch(decrement())}
            >
              <Text style={styles.buttonText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => dispatch(increment())}
            >
              <Text style={styles.buttonText}>+</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              value={inputAmount}
              onChangeText={setInputAmount}
              keyboardType="numeric"
            />
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleIncrementByAmount}
            >
              <Text style={styles.buttonText}>Add Amount</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Items</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Enter item name"
              value={inputValue}
              onChangeText={setInputValue}
            />
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleAddItem}
            >
              <Text style={styles.buttonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
          
          {/* Parent-Child Component Relationship */}
          <ItemList items={items} onRemoveItem={handleRemoveItem} />
        </View>

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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 15,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
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

