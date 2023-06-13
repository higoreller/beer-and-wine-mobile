import React, { useEffect, useRef, useState } from "react";
import { getFirestore, addDoc, collection } from "firebase/firestore";
import { StyleSheet, Text, View, SafeAreaView, Image } from "react-native";
import { Button } from "react-native-paper";
import { TextInput } from "react-native-paper";
import { Camera } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { shareAsync } from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Layout, TopNav, themeColor, useTheme } from "react-native-rapi-ui";

export default function ({ navigation }) {
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] =
    useState(null);
  const [beverage, setBeverage] = useState({
    name: "",
    manufacturer: "",
    date: "",
    price: "",
    location: "",
    description: "",
    image: null,
  });
  let cameraRef = useRef();

  // Get reference to the firestore
  const db = getFirestore();

  useEffect(() => {
    (async () => {
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      const mediaLibraryPermission =
        await MediaLibrary.requestPermissionsAsync();
      const imagePickerPermission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      setHasCameraPermission(cameraPermission.status === "granted");
      setHasMediaLibraryPermission(mediaLibraryPermission.status === "granted");

      if (imagePickerPermission.status !== "granted") {
        alert("Sorry, we need camera roll permissions to make this work!");
      }
    })();
  }, []);

  const handleChange = (name, value) => {
    setBeverage((prevState) => ({ ...prevState, [name]: value }));
  };

  let takePic = async () => {
    let options = {
      quality: 1,
      base64: true,
      exif: false,
    };

    try {
      let newPhoto = await cameraRef.current.takePictureAsync(options);
      handleChange("image", "data:image/jpg;base64," + newPhoto.base64);
    } catch (error) {
      console.log(error);
    }
  };

  let pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      base64: true,
    });

    if (!result.cancelled) {
      handleChange("image", "data:image/jpg;base64," + result.base64);
    }
  };

  let sharePic = () => {
    if (beverage.image) {
      shareAsync(beverage.image).then(() => {
        handleChange("image", null);
      });
    }
  };

  let savePhoto = () => {
    if (beverage.image) {
      MediaLibrary.saveToLibraryAsync(beverage.image).then(() => {
        handleChange("image", null);
      });
    }
  };

  const saveBeverage = async () => {
    try {
      await addDoc(collection(db, "beverages"), {
        name: beverage.name,
        manufacturer: beverage.manufacturer,
        date: beverage.date,
        price: beverage.price,
        location: beverage.location,
        description: beverage.description,
        image: beverage.image,
      });
      Toast.show({
        type: "success",
        position: "bottom",
        text1: "Sucesso",
        text2: "A bebida foi adicionada!",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        position: "bottom",
        text1: "Erro",
        text2: "A adição da bebida falhou!",
      });
      console.log("A adição da bebida falhou:", error);
    }
  };

  const { isDarkmode, setTheme } = useTheme();
  return (
    <Layout>
      <TopNav
        middleContent="Cadastre sua bebida"
        leftContent={
          <Ionicons
            name="chevron-back"
            size={20}
            color={isDarkmode ? themeColor.white100 : themeColor.dark}
          />
        }
        leftAction={() => navigation.goBack()}
        rightContent={
          <Ionicons
            name={isDarkmode ? "sunny" : "moon"}
            size={20}
            color={isDarkmode ? themeColor.white100 : themeColor.dark}
          />
        }
        rightAction={() => {
          if (isDarkmode) {
            setTheme("light");
          } else {
            setTheme("dark");
          }
        }}
      />
      <SafeAreaView style={styles.container}>
        {beverage.image ? (
          <>
            <Image style={styles.preview} source={{ uri: beverage.image }} />
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                color="#f5a623"
                style={styles.button}
                onPress={sharePic}
              >
                Share
              </Button>
              {hasMediaLibraryPermission ? (
                <Button
                  mode="contained"
                  color="#f5a623"
                  style={styles.button}
                  onPress={savePhoto}
                >
                  Save
                </Button>
              ) : null}
              <Button
                mode="contained"
                color="#f5a623"
                style={styles.button}
                onPress={() => handleChange("image", null)}
              >
                Discard
              </Button>
            </View>
          </>
        ) : (
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              color="#f5a623"
              style={styles.button}
              onPress={takePic}
            >
              Tirar foto
            </Button>
            <Button
              mode="contained"
              color="#f5a623"
              style={styles.button}
              onPress={pickImage}
            >
              Imagem do dispositivo
            </Button>
          </View>
        )}
        <TextInput
          label="Nome"
          value={beverage.name}
          style={styles.input}
          onChangeText={(text) => handleChange("name", text)}
        />

        <TextInput
          label="Fabricante"
          value={beverage.manufacturer}
          style={styles.input}
          onChangeText={(text) => handleChange("manufacturer", text)}
        />
        <TextInput
          label="Data"
          value={beverage.date}
          style={styles.input}
          onChangeText={(text) => handleChange("date", text)}
        />
        <TextInput
          label="Preço"
          value={beverage.price}
          style={styles.input}
          onChangeText={(text) => handleChange("price", text)}
        />
        <TextInput
          label="Local"
          value={beverage.location}
          style={styles.input}
          onChangeText={(text) => handleChange("location", text)}
        />
        <TextInput
          label="Descrição"
          value={beverage.description}
          style={styles.input}
          onChangeText={(text) => handleChange("description", text)}
        />
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            color="#f5a623"
            icon="content-save"
            style={styles.button}
            onPress={saveBeverage}
          >
            Salvar bebida
          </Button>
        </View>
      </SafeAreaView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 20,
  },
  preview: {
    width: "100%",
    height: 200,
    marginBottom: 20,
    resizeMode: "contain",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  input: {
    marginBottom: 10,
  },
});
