import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { LatLng, MapPressEvent, Marker } from 'react-native-maps';

type Weather = {
  temperature: number;
  windSpeed: number;
  precipitationProbability: number;
}

export default function App() {
  const [coordinates, setCoordinates] = useState<LatLng | null>(null);
  const [weather, setWeather] = useState<Weather| null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  async function getWeather(coords: LatLng): Promise<void> {
    try {   
      setLoading(true);
      const result = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current_weather=true&timezone=GMT&daily=precipitation_probability_max`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        }
      });
      const weatherObject = await result.json();
      if (!weatherObject.current_weather || !weatherObject.daily) {
        setWeather(null);
      } else {
        setWeather({
          temperature: Math.floor(weatherObject.current_weather.temperature),
          windSpeed: Math.floor(weatherObject.current_weather.windspeed),
          precipitationProbability: Math.max(...weatherObject.daily.precipitation_probability_max),
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMapPress(event: MapPressEvent): Promise<void> {
    const latitude = Number(event.nativeEvent.coordinate.latitude.toFixed(2));
    const longitude = Number(event.nativeEvent.coordinate.longitude.toFixed(2));
    setCoordinates({ latitude, longitude });
    await getWeather({ latitude, longitude });
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <MapView   
        style={styles.container}
        onPress={handleMapPress}
      >
        {coordinates && (
          <Marker
            coordinate={coordinates}
          />
        )}
      </MapView>
      <Modal 
        transparent={true} 
        visible={weather !== null ||  loading} 
        animationType='fade'
        statusBarTranslucent={true}
      >
        <View style={styles.modalContainer}>
          {loading ? (
            <View>
              <ActivityIndicator size={'large'} />
            </View>
          ) : (
            <View style={styles.modalView}>
              <View>
                <Text style={styles.infoIcon}>🌡️</Text>
                <Text style={styles.info}>{weather?.temperature} °C</Text>
              </View>
              <View>
                <Text style={styles.infoIcon}>💨</Text>
                <Text style={styles.info}>{weather?.windSpeed} Km/h</Text>
              </View>
              <View>
                <Text style={styles.infoIcon}>🌧️</Text>
                <Text style={styles.info}>{weather?.precipitationProbability}%</Text>
              </View>
              <TouchableOpacity style={styles.button} onPress={() => {
                setWeather(null);
                setCoordinates(null);
              }}>
                <Text style={styles.textButton}>Fechar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalView: {
    width: '80%',
    height: '40%',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#7a89da',
    padding: 15,
    width: '90%',
    borderRadius: 10,
  },
  textButton: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center'
  },
  info: {
    fontSize: 24,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  infoIcon: {
    textAlign: 'center',
    fontSize: 26,
  }
});
