import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {HomeScreen} from '../screens/HomeScreen';
import {BusListScreen} from '../screens/BusListScreen';
import {BusDetailScreen} from '../screens/BusDetailScreen';
import {StopsListScreen} from '../screens/StopsListScreen';
import {StopDetailScreen} from '../screens/StopDetailScreen';
import {colors} from '../shared/theme';

export type RootStackParamList = {
  Home: undefined;
  BusList: undefined;
  BusDetail: {routeNumber: string};
  StopsList: undefined;
  StopDetail: {stopName: string};
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking = {
  prefixes: ['wonjubus://'],
  config: {
    screens: {
      Home: '',
      BusList: 'buses',
      BusDetail: 'buses/:routeNumber',
      StopsList: 'stops',
      StopDetail: 'stops/:stopName',
    },
  },
};

export function AppNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {backgroundColor: colors.primary},
          headerTintColor: colors.white,
          headerTitleStyle: {fontWeight: '700'},
          animation: 'slide_from_right',
        }}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="BusList"
          component={BusListScreen}
          options={{title: '원주 버스 노선'}}
        />
        <Stack.Screen
          name="BusDetail"
          component={BusDetailScreen}
          options={({route}) => ({
            title: `${route.params.routeNumber}번 버스`,
          })}
        />
        <Stack.Screen
          name="StopsList"
          component={StopsListScreen}
          options={{title: '원주 버스 종점'}}
        />
        <Stack.Screen
          name="StopDetail"
          component={StopDetailScreen}
          options={({route}) => ({
            title: route.params.stopName,
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
