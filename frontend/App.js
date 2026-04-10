import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

// Cambia esta URL por la IP de tu PC cuando pruebes en celular fisico.
const API_BASE_URL = "http://localhost:5000";

const emptyRegister = {
  username: "",
  email: "",
  password: "",
  fullName: "",
  bio: "",
};

const emptyLogin = {
  usernameOrEmail: "",
  password: "",
};

function buildImageSource(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return { uri: path };
  }
  return { uri: `${API_BASE_URL}${path}` };
}

function createMultipartData(fields, imageAsset, imageFieldName) {
  const formData = new FormData();

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  if (imageAsset?.uri) {
    formData.append(imageFieldName, {
      uri: imageAsset.uri,
      name: imageAsset.fileName || `${imageFieldName}.jpg`,
      type: imageAsset.mimeType || "image/jpeg",
    });
  }

  return formData;
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState("login");
  const [sessionChecked, setSessionChecked] = useState(false);

  const [registerData, setRegisterData] = useState(emptyRegister);
  const [registerImage, setRegisterImage] = useState(null);

  const [loginData, setLoginData] = useState(emptyLogin);

  const [profile, setProfile] = useState(null);
  const [profileEdit, setProfileEdit] = useState({
    username: "",
    email: "",
    fullName: "",
    bio: "",
    password: "",
  });
  const [profileImage, setProfileImage] = useState(null);

  const profileImageSource = useMemo(() => {
    if (profileImage?.uri) return { uri: profileImage.uri };
    return buildImageSource(profile?.profileImage);
  }, [profileImage, profile]);

  async function apiFetch(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: "include",
      ...options,
      headers: {
        ...(options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...(options.headers || {}),
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || data.message || "Error inesperado");
    }
    return data;
  }

  async function pickImage(setter) {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permiso requerido", "Debes permitir acceso a tus fotos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setter(result.assets[0]);
    }
  }

  async function loadProfile() {
    const data = await apiFetch("/auth/profile");
    setProfile(data.user);
    setProfileEdit({
      username: data.user.username || "",
      email: data.user.email || "",
      fullName: data.user.fullName || "",
      bio: data.user.bio || "",
      password: "",
    });
    setScreen("profile");
  }

  async function checkSession() {
    try {
      const data = await apiFetch("/auth/check");
      if (data.isAuthenticated) {
        await loadProfile();
      }
    } catch (_error) {
      // Ignorar error al iniciar
    } finally {
      setSessionChecked(true);
    }
  }

  useEffect(() => {
    checkSession();
  }, []);

  async function handleRegister() {
    try {
      setLoading(true);
      const body = createMultipartData(registerData, registerImage, "profileImage");
      await apiFetch("/auth/register", {
        method: "POST",
        body,
      });

      Alert.alert("Registro exitoso", "Ahora inicia sesion con tu cuenta");
      setRegisterData(emptyRegister);
      setRegisterImage(null);
      setScreen("login");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    try {
      setLoading(true);
      await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(loginData),
      });
      await loadProfile();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      setLoading(true);
      await apiFetch("/auth/logout", { method: "POST" });
      setProfile(null);
      setProfileImage(null);
      setLoginData(emptyLogin);
      setScreen("login");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile() {
    try {
      setLoading(true);
      const body = createMultipartData(
        {
          ...profileEdit,
          password: profileEdit.password || undefined,
        },
        profileImage,
        "profileImage"
      );

      await apiFetch("/auth/profile", {
        method: "PUT",
        body,
      });

      setProfileImage(null);
      await loadProfile();
      Alert.alert("Listo", "Perfil actualizado");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProfileImage() {
    try {
      setLoading(true);
      await apiFetch("/auth/profile/image", { method: "DELETE" });
      setProfileImage(null);
      await loadProfile();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleDeleteAccount() {
    Alert.alert("Eliminar cuenta", "Esta accion no se puede deshacer", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await apiFetch("/auth/profile", { method: "DELETE" });
            setProfile(null);
            setProfileImage(null);
            setRegisterData(emptyRegister);
            setLoginData(emptyLogin);
            setScreen("login");
          } catch (error) {
            Alert.alert("Error", error.message);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  }

  if (!sessionChecked) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#6ea8fe" />
        <Text style={styles.mutedText}>Verificando sesion...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>PeopleFinder</Text>
        <Text style={styles.subtitle}>Auth y perfil con imagen</Text>

        {screen !== "profile" ? (
          <View style={styles.card}>
            <View style={styles.tabRow}>
              <Pressable
                style={[styles.tab, screen === "login" && styles.tabActive]}
                onPress={() => setScreen("login")}
              >
                <Text style={styles.tabText}>Login</Text>
              </Pressable>
              <Pressable
                style={[styles.tab, screen === "register" && styles.tabActive]}
                onPress={() => setScreen("register")}
              >
                <Text style={styles.tabText}>Registro</Text>
              </Pressable>
            </View>

            {screen === "login" ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Usuario o email"
                  placeholderTextColor="#94a3b8"
                  value={loginData.usernameOrEmail}
                  onChangeText={(value) =>
                    setLoginData((prev) => ({ ...prev, usernameOrEmail: value }))
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="Contrasena"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  value={loginData.password}
                  onChangeText={(value) =>
                    setLoginData((prev) => ({ ...prev, password: value }))
                  }
                />
                <Pressable style={styles.primaryButton} onPress={handleLogin}>
                  <Text style={styles.buttonText}>Iniciar sesion</Text>
                </Pressable>
              </>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre completo"
                  placeholderTextColor="#94a3b8"
                  value={registerData.fullName}
                  onChangeText={(value) =>
                    setRegisterData((prev) => ({ ...prev, fullName: value }))
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="Usuario"
                  placeholderTextColor="#94a3b8"
                  value={registerData.username}
                  onChangeText={(value) =>
                    setRegisterData((prev) => ({ ...prev, username: value }))
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#94a3b8"
                  value={registerData.email}
                  onChangeText={(value) =>
                    setRegisterData((prev) => ({ ...prev, email: value }))
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="Contrasena"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  value={registerData.password}
                  onChangeText={(value) =>
                    setRegisterData((prev) => ({ ...prev, password: value }))
                  }
                />
                <TextInput
                  style={[styles.input, styles.textarea]}
                  placeholder="Bio"
                  placeholderTextColor="#94a3b8"
                  multiline
                  value={registerData.bio}
                  onChangeText={(value) =>
                    setRegisterData((prev) => ({ ...prev, bio: value }))
                  }
                />
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => pickImage(setRegisterImage)}
                >
                  <Text style={styles.buttonText}>Seleccionar imagen</Text>
                </Pressable>
                {registerImage?.uri ? (
                  <Image source={{ uri: registerImage.uri }} style={styles.avatarPreview} />
                ) : null}
                <Pressable style={styles.primaryButton} onPress={handleRegister}>
                  <Text style={styles.buttonText}>Crear cuenta</Text>
                </Pressable>
              </>
            )}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Mi perfil</Text>
            {profileImageSource ? (
              <Image source={profileImageSource} style={styles.avatarPreview} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>Sin imagen</Text>
              </View>
            )}

            <Pressable style={styles.secondaryButton} onPress={() => pickImage(setProfileImage)}>
              <Text style={styles.buttonText}>Cambiar imagen</Text>
            </Pressable>

            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              placeholderTextColor="#94a3b8"
              value={profileEdit.fullName}
              onChangeText={(value) =>
                setProfileEdit((prev) => ({ ...prev, fullName: value }))
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Usuario"
              placeholderTextColor="#94a3b8"
              value={profileEdit.username}
              onChangeText={(value) =>
                setProfileEdit((prev) => ({ ...prev, username: value }))
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#94a3b8"
              value={profileEdit.email}
              onChangeText={(value) =>
                setProfileEdit((prev) => ({ ...prev, email: value }))
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Nueva contrasena (opcional)"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={profileEdit.password}
              onChangeText={(value) =>
                setProfileEdit((prev) => ({ ...prev, password: value }))
              }
            />
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Bio"
              placeholderTextColor="#94a3b8"
              multiline
              value={profileEdit.bio}
              onChangeText={(value) => setProfileEdit((prev) => ({ ...prev, bio: value }))}
            />

            <Pressable style={styles.primaryButton} onPress={handleUpdateProfile}>
              <Text style={styles.buttonText}>Guardar cambios</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={handleDeleteProfileImage}>
              <Text style={styles.buttonText}>Eliminar imagen de perfil</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={handleLogout}>
              <Text style={styles.buttonText}>Cerrar sesion</Text>
            </Pressable>

            <Pressable style={styles.dangerButton} onPress={handleDeleteAccount}>
              <Text style={styles.buttonText}>Eliminar cuenta</Text>
            </Pressable>
          </View>
        )}

        {loading ? <ActivityIndicator size="small" color="#6ea8fe" /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0b1120",
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0b1120",
    gap: 12,
  },
  title: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: "#94a3b8",
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#0f172a",
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#1e293b",
  },
  tabText: {
    color: "#e2e8f0",
    fontWeight: "600",
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    color: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textarea: {
    minHeight: 92,
    textAlignVertical: "top",
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  dangerButton: {
    backgroundColor: "#b91c1c",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#f8fafc",
    fontWeight: "700",
  },
  avatarPreview: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignSelf: "center",
    borderWidth: 2,
    borderColor: "#334155",
  },
  avatarPlaceholder: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    borderColor: "#334155",
    backgroundColor: "#0f172a",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPlaceholderText: {
    color: "#94a3b8",
    fontWeight: "700",
  },
  mutedText: {
    color: "#94a3b8",
  },
});
