import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Modal } from "@/components/modal";
import { Participant, ParticipantProps } from "@/components/participant";
import { TripLink, TripLinkProps } from "@/components/tripLink";
import { linksServer } from "@/server/links-server";
import { participantsServer } from "@/server/participants-server";
import { colors } from "@/styles/colors";
import { validateInput } from "@/utils/validateInput";
import { Link2, PlusIcon, Tag } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Text, View, FlatList } from "react-native";

export function TripDetail({ tripId }: { tripId: string }) {
  const [showNewLinkModal, setShowNewLinkModal] = useState(false);
  const [linkName, setLinkName] = useState("");
  const [linkURL, setLinkURL] = useState("");
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [links, setLinks] = useState<TripLinkProps[]>([]);
  const [participants, setParticipants] = useState<ParticipantProps[]>([]);

  function resetNewLinkInput() {
    setLinkName("");
    setLinkURL("");
    setShowNewLinkModal(false);
  }

  async function handleCreateLink() {
    try {
      if (!validateInput.url(linkURL.trim())) {
        return Alert.alert("Link", "Link inválido, tente novamente");
      }
      if (linkName.trim().length <= 0) {
        return Alert.alert(
          "Nome do link",
          "Por favor, insira um nome ao seu link!"
        );
      }
      setIsCreatingLink(true);

      await linksServer.create({
        tripId,
        title: linkName,
        url: linkURL,
      });

      Alert.alert("Link", "Link criado com sucesso");
      resetNewLinkInput();
      await getTripLink();
    } catch (error) {
      console.log(error);
    } finally {
      setIsCreatingLink(false);
    }
  }

  async function getTripLink() {
    try {
      const linksTrip = await linksServer.getLinksByTripId(tripId);
      setLinks(linksTrip);
    } catch (error) {
      console.log(error);
      Alert.alert(
        "Ops",
        "Não conseguimos obter os links da viagem, tente novamente"
      );
    }
  }

  async function getTripParticipant() {
    try {
      const participants = await participantsServer.getByTripId(tripId);
      console.log(participants);
      setParticipants(participants);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    getTripLink();
    getTripParticipant();
  }, []);

  return (
    <View className="flex-1 mt-5">
      <Text className="text-zinc-50 text-2xl font-semibold mb-4">
        Links importantes
      </Text>

      <View>
        {links.length > 0 ? (
          <FlatList
            data={links}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TripLink data={item} />}
            contentContainerClassName="gap-4"
          />
        ) : (
          <Text className="text-zinc-400 font-regular text-base mt-2 mb-6">
            Nenhum link adicionado.
          </Text>
        )}
        <Button className="mt-4" variant="secondary" onPress={() => setShowNewLinkModal(true)}>
          <PlusIcon color={colors.zinc[200]} size={20} />
          <Button.Title>Cadastrar novo link</Button.Title>
        </Button>
      </View>

      <View className="flex-1 border-t border-zinc-800 mt-6">
        <Text className="text-zinc-50 text-2xl font-semibold my-6">
          Convidados
        </Text>

        <FlatList
          data={participants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Participant data={item} />}
          contentContainerClassName="gap-4 pb-44"
        />
      </View>

      <Modal
        title="Cadastrar link"
        subtitle="Todos os convidados podem visualizar os links importantes."
        visible={showNewLinkModal}
        onClose={() => setShowNewLinkModal(false)}
      >
        <View className="gap-2 mb-3">
          <Input variant="secondary">
            <Tag color={colors.zinc[400]} size={20} />
            <Input.Field
              placeholder="Título do link"
              onChangeText={setLinkName}
            />
          </Input>

          <Input variant="secondary">
            <Link2 color={colors.zinc[400]} size={20} />
            <Input.Field placeholder="URL" onChangeText={setLinkURL} />
          </Input>
        </View>

        <Button isLoading={isCreatingLink} onPress={handleCreateLink}>
          <Button.Title>Salvar link</Button.Title>
        </Button>
      </Modal>
    </View>
  );
}
