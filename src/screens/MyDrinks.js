import React, { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  StyleSheet,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  Modal,
  Button,
} from "react-native";
import { Layout, TopNav, themeColor, useTheme } from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

export default function ({ navigation }) {
  const [beverages, setBeverages] = useState([]);
  const [editedData, setEditedData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const db = getFirestore();

  useEffect(() => {
    const fetchBeverages = async () => {
      const querySnapshot = await getDocs(collection(db, "beverages"));
      let beveragesList = [];
      querySnapshot.forEach((doc) => {
        beveragesList.push({ id: doc.id, ...doc.data() });
      });
      setBeverages(beveragesList);
    };
    fetchBeverages();
  }, []);

  const openImagePicker = async (id) => {
    let permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("Permission to access camera roll is required.");
      return;
    }

    let pickerResult = await ImagePicker.launchImageLibraryAsync();
    console.log(pickerResult);

    if (pickerResult.cancelled === true) {
      return;
    }

    setEditedData((prev) => ({
      ...prev,
      [id]: { ...prev[id], image: pickerResult.uri },
    }));
    setSelectedImage(pickerResult.uri);
  };

  const handleUpdate = async (id) => {
    // Simulando um update otimista
    const newBeverages = beverages.map((bev) =>
      bev.id === id ? { ...bev, ...editedData[id] } : bev
    );
    setBeverages(newBeverages);

    const beverageRef = doc(db, "beverages", id);
    try {
      await updateDoc(beverageRef, editedData[id]);
    } catch (error) {
      // Revertendo a mudança se falhar
      const originalBeverages = beverages.map((bev) =>
        bev.id === id ? { ...bev } : bev
      );
      setBeverages(originalBeverages);
      console.log(error);
    }
    setModalVisible(false);
    setSelectedImage(null);
  };

  const handleDelete = async (id) => {
    const newBeverages = beverages.filter((bev) => bev.id !== id);
    setBeverages(newBeverages);

    const beverageRef = doc(db, "beverages", id);
    try {
      await deleteDoc(beverageRef);
    } catch (error) {
      const originalBeverages = [...beverages];
      setBeverages(originalBeverages);
      console.log(error);
    }
  };

  const { isDarkmode, setTheme } = useTheme();
  return (
    <Layout>
      <TopNav
        middleContent="Bebidas"
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
      <View style={styles.container}>
        {beverages.map((beverage) => (
          <View key={beverage.id} style={styles.card}>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(true);
                openImagePicker(beverage.id);
              }}
            >
              <Image
                style={styles.image}
                source={{
                  uri: editedData[beverage.id]?.image || beverage.image,
                }}
              />
            </TouchableOpacity>
            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
            >
              <View style={styles.modalView}>
                {selectedImage && (
                  <Image
                    source={{ uri: selectedImage }}
                    style={{ width: 200, height: 200 }}
                  />
                )}
                <Button
                  title="Close"
                  style={styles.button}
                  onPress={() => setModalVisible(false)}
                />
              </View>
            </Modal>
            <View style={styles.details}>
              <TextInput
                style={styles.input}
                value={editedData[beverage.id]?.title || beverage.title}
                onChangeText={(text) =>
                  setEditedData((prev) => ({
                    ...prev,
                    [beverage.id]: { ...prev[beverage.id], title: text },
                  }))
                }
              />
              <TextInput
                style={styles.input}
                value={
                  editedData[beverage.id]?.description || beverage.description
                }
                onChangeText={(text) =>
                  setEditedData((prev) => ({
                    ...prev,
                    [beverage.id]: { ...prev[beverage.id], description: text },
                  }))
                }
              />
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => handleUpdate(beverage.id)}
              >
                <Ionicons name="pencil-outline" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={() => handleDelete(beverage.id)}
              >
                <Ionicons name="trash-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 20,
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    padding: 20,
    borderRadius: 10,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  details: {
    flex: 1,
    marginLeft: 20,
  },
  input: {
    marginBottom: 10,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 80,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "darkblue",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
