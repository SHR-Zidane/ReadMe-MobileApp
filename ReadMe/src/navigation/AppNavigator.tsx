import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import BookDetailsScreen from '../screens/BookDetailsScreen';
import ReaderScreen from '../screens/ReaderScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
      />
      <Stack.Screen
        name="BookDetails"
        component={BookDetailsScreen}
        options={{ 
          headerShown: true,
          title: 'Détails du livre' 
        }}
      />
      <Stack.Screen
        name="Reader"
        component={ReaderScreen}
        options={({ route }: any) => ({ 
          headerShown: true, 
          title: route.params?.title || 'Lecture' 
        })}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
