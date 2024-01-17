import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  ImageBackground,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Carousel from 'react-native-snap-carousel';
import Feather from 'react-native-vector-icons/Feather';

import BannerSlider from '../components/BannerSlider';
import { windowWidth } from '../utils/Dimensions';

import { freeGames, paidGames, sliderData } from '../model/data';
import CustomSwitch from '../components/CustomSwitch';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ListItem from '../components/ListItem';
import { AuthContext } from '../context/AuthContext';
import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize
} from "react-native-responsive-dimensions";
import { useIsFocused } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import Loader from '../components/Loader';
import moment from 'moment';

export default function HomeScreen({ navigation }) {
  const isFocused = useIsFocused();
  const { userToken, isLoadingGlobal, setIsLoadingGlobal } = useContext(AuthContext);
  const [events, setEvents] = useState(null);
  const [gamesTab, setGamesTab] = useState(1);
  const carouselRef = useRef(null);

  const updateIsPlayStatus = (events) => {
    const currentTime = moment();
    const updatedEvents = events.map((event) => {
      const openTime = moment(event.open, 'hh:mm A');
      const closeTime = moment(event.close, 'hh:mm A');
      event.isPlay = closeTime.isBefore(currentTime) ? 'No' : 'Yes';
      event.openTime = openTime;
      return event;
    });

    const sortedEvents = updatedEvents.sort((a, b) => a.openTime - b.openTime);

    return sortedEvents;
  };
  function updateSubtitles() {
    const currentDate = new Date();
    const currentHour = currentDate.getHours();
    const currentMinutes = currentDate.getMinutes();

    // Get the open time of the first element
    const firstGameOpenTime = freeGames[0]?.open;

    if (firstGameOpenTime) {
      // Split the open time into hours and minutes
      const [openHour, openMinutes] = firstGameOpenTime.split(':').map(Number);

      // Compare the current time with the open time
      if (currentHour < openHour || (currentHour === openHour && currentMinutes < openMinutes)) {
        // If the current time is earlier than the open time, update the subtitles
        const updatedEvents = events.map((event) => {
          event.subtitle = '***-**-***';
          return event;
        });

        updateAllEventsSubtitles();
        setEvents(updatedEvents);
      }
    }
  }
  const updateAllEventsSubtitles = async () => {
    try {
      const querySnapshot = await firestore().collection('Events').get();
      const batch = firestore().batch();

      querySnapshot.forEach((doc) => {
        const eventRef = doc.ref;
        batch.update(eventRef, { subtitle: '***-**-***' });
      });
      await batch.commit();
      console.log('Batch update successful');
    } catch (error) {
      console.error('Error updating batch:', error);
    }
  };
  const renderBanner = ({ item, index }) => {
    return <BannerSlider data={item} />;
  };

  const onSelectSwitch = value => {
    setGamesTab(value);
  };
  const handleEventList = async () => {
    const querySnapshot = await firestore()
      .collection('Events')
      .orderBy('isPlay', 'asc')
      .get();
    const userDataArray = querySnapshot.docs.map(doc => doc.data());
    const updatedEvents = updateIsPlayStatus(userDataArray);
    setEvents(updatedEvents);
    // console.log(userDataArray, "snapshot");
  };
  useEffect(() => {
    if (isFocused) {
      try {
        setIsLoadingGlobal(true);
        // Example usage
        handleEventList();
        // console.log(freeGames);
        // setEvents(freeGames);
        // Call the updateSubtitles function when the app is opened
        updateSubtitles();
      } catch (error) {
        console.log(error, 'error');
      } finally {
        setIsLoadingGlobal(false);
      }
    }
  }, [isFocused]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView style={{ padding: responsiveWidth(5.5) }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: responsiveWidth(5.5),
          }}>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons
              name="menu"
              size={responsiveWidth(8.5)}
              color='#333'
            />
          </TouchableOpacity>
          <Text style={{ fontSize: responsiveFontSize(2.7), fontFamily: 'Roboto-Medium', marginTop: responsiveWidth(0.5), color: '#333' }}>
            Ratan khatri matka
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Wallet Statement')}>
            <View
              style={{
                // marginVertical: 15,
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}>
              <Ionicons
                name="wallet"
                size={responsiveWidth(8.5)}
                color='#333'
              />
              <Text style={{ fontSize: responsiveFontSize(2.5), fontFamily: 'Roboto-Medium', textAlign: 'center', margin: responsiveWidth(1), color: '#333' }}>
                {userToken?.coins ? userToken?.coins : 0}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* <View
          style={{
            flexDirection: 'row',
            borderColor: '#C6C6C6',
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 10,
            // paddingVertical: 8,
            alignItems: 'center',
          }}>
          <Feather
            name="search"
            size={20}
            color="#C6C6C6"
            style={{marginRight: 5}}
          />
          <TextInput placeholder="Search" />
        </View> */}

        {/* <View
          style={{
            marginVertical: 15,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}>
          <Text style={{fontSize: 18, fontFamily: 'Roboto-Medium'}}>
            Upcoming Games
          </Text>
          <TouchableOpacity onPress={() => {}}>
            <Text style={{color: '#0aada8'}}>See all</Text>
          </TouchableOpacity>
        </View> */}

        <Carousel
          ref={carouselRef}
          data={sliderData}
          renderItem={renderBanner}
          sliderWidth={responsiveWidth(90)}
          itemWidth={responsiveWidth(85)}
          loop={true}
          autoplay={true}
          autoplayInterval={3000}
        />

        <View style={{
          marginVertical: responsiveWidth(5.5), flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
          <TouchableOpacity onPress={() => { navigation.navigate('Add Fund'); }} style={{
            backgroundColor: '#6a0028',
            padding: 10,
            width: responsiveWidth(36),
            borderRadius: responsiveWidth(3),
          }}>
            <Text style={{
              color: '#fff',
              textAlign: 'center',
              fontFamily: 'Roboto-Medium',
              fontSize: responsiveFontSize(2),
            }}>Add Points</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { navigation.navigate('Withdraw Fund'); }} style={{
            backgroundColor: '#6a0028',
            padding: 10,
            width: responsiveWidth(36),
            borderRadius: responsiveWidth(3),
          }}>
            <Text style={{
              color: '#fff',
              textAlign: 'center',
              fontFamily: 'Roboto-Medium',
              fontSize: responsiveFontSize(2),
            }}>Withdraw Money</Text>
          </TouchableOpacity>
          {/* <CustomSwitch
            selectionMode={1}
            option1="Free to play"
            option2="Paid games"
            onSelectSwitch={onSelectSwitch}
          /> */}
        </View>

        {events && events.map(item => (
          <ListItem
            key={item.open}
            navigation={navigation}
            // photo={item.poster}
            title={item.title}
            subTitle={item.subtitle}
            isPlay={item.isPlay}
            open={item.open}
            close={item.close}
            onPress={() =>
              navigation.navigate('Game', {
                title: item.title,
                id: item.id,
                open: item.open,
                close: item.close,
              })
            }
          />
        ))}
        {/* {gamesTab === 2 &&
          paidGames.map(item => (
            <ListItem
              key={item.id}
              photo={item.poster}
              title={item.title}
              subTitle={item.subtitle}
              isFree={item.isFree}
              price={item.price}
              onPress={() =>
                navigation.navigate('GameDetails', {
                  title: item.title,
                  id: item.id,
                })
              }
            />
          ))} */}
        <Loader visible={isLoadingGlobal} />
      </ScrollView>
    </SafeAreaView>
  );
}
