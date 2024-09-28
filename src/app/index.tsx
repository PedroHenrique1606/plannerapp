import { Button } from "@/components/button";
import { Calendar } from "@/components/calendar";
import { GuestEmail } from "@/components/email";
import { Input } from "@/components/input";
import Loading from "@/components/loading";
import { Modal } from "@/components/modal";
import { tripServer } from "@/server/trip-server";
import { tripStorage } from "@/storage/trip";
import { colors } from "@/styles/colors";
import { calendarUtils, DatesSelected } from "@/utils/calendarUtils";
import { validateInput } from "@/utils/validateInput";
import dayjs from "dayjs";
import { router } from "expo-router";
import {
  ArrowRight,
  AtSign,
  Calendar as IconCalendar,
  MapPin,
  Settings2,
  UserRoundPlus,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Image, Keyboard, Text, View } from "react-native";
import { DateData } from "react-native-calendars";

enum STEPFORM {
  TRIP_DETAILS = 1,
  ADD_EMAILS = 2,
}

enum MODAL {
  NONE = 0,
  CALENDAR = 1,
  GUESTS = 2,
}

export default function Index() {
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [isGettingTrip, setIsGettingTrip] = useState(true);
  const [stepForm, setStepForm] = useState(STEPFORM.TRIP_DETAILS);
  const [showModal, setShowModal] = useState(MODAL.NONE);
  const [selectedDates, setSelectedDates] = useState({} as DatesSelected);
  const [destination, setDestination] = useState("");
  const [emailToInvite, setEmailToInvite] = useState("");
  const [emailsToInvite, setEmailsToInvite] = useState<string[]>([]);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");

  function handleSelectDate(selectedDay: DateData) {
    const dates = calendarUtils.orderStartsAtAndEndsAt({
      startsAt: selectedDates.startsAt,
      endsAt: selectedDates.endsAt,
      selectedDay,
    });

    setSelectedDates(dates);
  }

  function handleNextStepForm() {
    if (
      destination.trim().length === 0 ||
      !selectedDates.startsAt ||
      !selectedDates.endsAt
    ) {
      return Alert.alert(
        "Detalhes da viagem",
        "Preencha todas as informações da viagem para seguir adiante"
      );
    }

    if (destination.length < 4) {
      return Alert.alert(
        "Destino da viagem",
        "O destino precisa ter mais do que 4 caracteres"
      );
    }
    if (stepForm === STEPFORM.TRIP_DETAILS) {
      return setStepForm(STEPFORM.ADD_EMAILS);
    }

    Alert.alert("Nova viagem", "Confirmar viagem?", [
      {
        text: "Não",
        style: "cancel",
      },
      {
        text: "Confirmar",
        onPress: createTrip,
      },
    ]);
  }

  function handleRemoveEmail(emailToRemove: string) {
    setEmailsToInvite((prevState) =>
      prevState.filter((email) => email !== emailToRemove)
    );
  }

  function handleAddEmail() {
    if (!validateInput.email(emailToInvite)) {
      return Alert.alert("Convidado", "E-mail inválido!");
    }
    const emailAlreadyExist = emailsToInvite.find(
      (email) => email === emailToInvite
    );

    if (emailAlreadyExist) {
      return Alert.alert("Convidado", "Este e-mail já foi adicionado!");
    }

    setEmailsToInvite((prevState) => [...prevState, emailToInvite]);
    setEmailToInvite("");
  }

  async function saveTrip(tripId: string) {
    try {
      await tripStorage.save(tripId);
      router.navigate(`/trip/${tripId}`);
    } catch (error) {
      Alert.alert(
        "Salvar viagem",
        "Não foi possível salvar sua viagem, tente novamente!"
      );
      console.log(error);
    }
  }

  async function createTrip() {
    try {
      setIsCreatingTrip(true);
      const newTrip = await tripServer.create({
        destination,
        starts_at: dayjs(selectedDates.startsAt?.dateString).toString(),
        ends_at: dayjs(selectedDates.endsAt?.dateString).toString(),
        emails_to_invite: emailsToInvite,
        owner_email: ownerEmail,
        owner_name: ownerName,
      });

      console.log(emailsToInvite)

      Alert.alert("Nova viagem", "Sua viagem foi criada com sucesso", [
        {
          text: "Ok, Continuar.",
          onPress: () => saveTrip(newTrip.tripId),
        },
      ]);
    } catch (error) {
      console.log(error);
      setIsCreatingTrip(false);
    }
  }

  async function getTrip() {
    try {
      const tripId = await tripStorage.get();

      if (!tripId) {
        return setIsGettingTrip(false);
      }

      const trip = await tripServer.getById(tripId);
      console.log(trip);

      if (trip) {
        return router.navigate(`/trip/${trip.id}`);
      }
    } catch (error) {
      setIsGettingTrip(false);
      console.log(error);
    }
  }

  useEffect(() => {
    getTrip();
  }, []);

  if (isGettingTrip) {
    return <Loading />;
  }

  return (
    <View className="flex-1 items-center justify-center px-5">
      <Image
        source={require("@/assets/logo.png")}
        className="h-8"
        resizeMode="contain"
      />
      <Image source={require("@/assets/bg.png")} className="absolute" />
      <Text className="text-zinc-400 font-regular text-center text-lg mt-3">
        Convide seus amigos e planeje sua{"\n"}próxima viagem
      </Text>

      <View className="w-full bg-zinc-900 p-4 rounded-lg my-8 border border-zinc-800">
        <Input>
          <MapPin color={colors.zinc[400]} size={20} />
          <Input.Field
            placeholder="Para onde?"
            editable={stepForm === STEPFORM.TRIP_DETAILS}
            onChangeText={setDestination}
            value={destination}
          />
        </Input>
        <Input>
          <IconCalendar color={colors.zinc[400]} size={20} />
          <Input.Field
            placeholder="Quando?"
            editable={stepForm === STEPFORM.TRIP_DETAILS}
            onFocus={() => Keyboard.dismiss()}
            showSoftInputOnFocus={false}
            onPressIn={() =>
              stepForm === STEPFORM.TRIP_DETAILS && setShowModal(MODAL.CALENDAR)
            }
            value={selectedDates.formatDatesInText}
          />
        </Input>

        {stepForm === STEPFORM.ADD_EMAILS && (
          <>
            <View className="border-b py-3 border-zinc-800">
              <Button
                variant="secondary"
                onPress={() => setStepForm(STEPFORM.TRIP_DETAILS)}
              >
                <Button.Title>Alterar local/data</Button.Title>
                <Settings2 color={colors.zinc[200]} size={20} />
              </Button>
            </View>
            <Input>
              <UserRoundPlus color={colors.zinc[400]} size={20} />
              <Input.Field
                placeholder="Quem estará na viagem?"
                autoCorrect={false}
                value={
                  emailsToInvite.length > 0
                    ? `${emailsToInvite.length} pessoas(a) convidadas(a)`
                    : ""
                }
                onPressIn={() => {
                  Keyboard.dismiss();
                  setShowModal(MODAL.GUESTS);
                }}
                showSoftInputOnFocus={false}
              />
            </Input>
          </>
        )}

        <Button
          className="my-2"
          onPress={handleNextStepForm}
          isLoading={isCreatingTrip}
        >
          <Button.Title>
            {stepForm === STEPFORM.TRIP_DETAILS
              ? "Continuar"
              : "Confirmar Viagem"}
          </Button.Title>
          <ArrowRight color={colors.lime[950]} size={20} />
        </Button>
      </View>
      <Text className="text-zinc-500 font-regular text-center text-base">
        Ao planejar sua viagem pela Plann.er você automaticamente concorda com
        nossos{" "}
        <Text className="text-zinc-300 underline">
          termos de uso e políticas de privacidade
        </Text>
      </Text>
      <Modal
        title="Selecione a data"
        subtitle="Selecione a data de ida e volta da viagem"
        visible={showModal === MODAL.CALENDAR}
        onClose={() => {
          setShowModal(MODAL.NONE);
        }}
      >
        <View className="gap-4 mt-4">
          <Calendar
            onDayPress={handleSelectDate}
            markedDates={selectedDates.dates}
            minDate={dayjs().toISOString()}
          />
          <Button onPress={() => setShowModal(MODAL.NONE)}>
            <Button.Title>Confirmar</Button.Title>
          </Button>
        </View>
      </Modal>

      <Modal
        title="Selecionar Convidados"
        subtitle="Os convidados irão receber emails para confirmar a participação na viagem"
        visible={showModal === MODAL.GUESTS}
        onClose={() => setShowModal(MODAL.NONE)}
      >
        <View className="my-2 flex-wrap gap-2 border-b border-zinc-800 py-5 items-center">
          <Input variant="secondary">
            <UserRoundPlus color={colors.zinc[400]} size={20} />
            <Input.Field
              placeholder="Nome do Organizador"
              onChangeText={setOwnerName}
              value={ownerName}
            />
          </Input>

          <Input variant="secondary">
            <AtSign color={colors.zinc[400]} size={20} />
            <Input.Field
              placeholder="Email do Organizador"
              keyboardType="email-address"
              onChangeText={setOwnerEmail}
              value={ownerEmail}
            />
          </Input>
        </View>
        <View className="my-2 flex-wrap gap-2 py-5 items-center">
          {emailsToInvite.length > 0 ? (
            emailsToInvite.map((email) => (
              <GuestEmail
                key={email}
                email={email}
                onRemove={() => handleRemoveEmail(email)}
              />
            ))
          ) : (
            <Text className="text-zinc-500 text-base font-regular">
              Nenhum email adicionado
            </Text>
          )}
        </View>
        <View className="gap-4 mt-4">
          <Input variant="secondary">
            <AtSign color={colors.zinc[400]} size={20} />
            <Input.Field
              placeholder="Digite o email do convidado"
              keyboardType="email-address"
              onChangeText={(text) => setEmailToInvite(text.toLowerCase())}
              value={emailToInvite}
              returnKeyType="send"
              onSubmitEditing={handleAddEmail}
            />
          </Input>
          <Button onPress={handleAddEmail}>
            <Button.Title>Convidar</Button.Title>
          </Button>
        </View>
      </Modal>
    </View>
  );
}