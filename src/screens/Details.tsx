import React, { useEffect, useState } from "react";
import { Box, HStack, ScrollView, Text, VStack, useTheme } from "native-base";
import { Header } from "../components/Header";
import { useNavigation, useRoute } from "@react-navigation/native";
import { OrderProps } from "../components/Order";
import firestore from "@react-native-firebase/firestore";
import { OrderFirestoreDTO } from "../DTOs/orderDTO";
import { dateFormat } from "../utils/firestoreDateFormat";
import { Loading } from "../components/Loading";
import {
  CircleWavyCheck,
  Clipboard,
  DesktopTower,
  Hourglass,
} from "phosphor-react-native";
import { CardDetails } from "../components/CardDetails";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Alert } from "react-native";

type RouteParams = {
  orderId: string;
};

type OrderDetails = OrderProps & {
  description: string;
  solution: string;
  closed: string;
};

export function Details() {
  const navigation = useNavigation();
  const [solution, setSolution] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetails>({} as OrderDetails);

  const { colors } = useTheme();

  const route = useRoute();
  const { orderId } = route.params as RouteParams;

  function handleOrderClose() {
    if (!solution) {
      return Alert.alert(
        "Solicitação",
        "Informe uma solução para encerrar a solicitação"
      );
    }

    firestore()
      .collection<OrderFirestoreDTO>("orders")
      .doc(orderId)
      .update({
        status: "closed",
        solution,
        closed_at: firestore.FieldValue.serverTimestamp(),
      })
      .then(() => {
        navigation.goBack();
        Alert.alert("Solicitação", "Solicitação encerrada com sucesso.");
      })
      .catch((error) => {
        console.log(error);
        Alert.alert("Solicitação", "Erro ao encerrar solicitação.");
      });
  }

  useEffect(() => {
    firestore()
      .collection<OrderFirestoreDTO>("orders")
      .doc(orderId)
      .get()
      .then((doc) => {
        const {
          patrimony,
          description,
          status,
          created_at,
          closed_at,
          solution,
        } = doc.data();

        const closed = !!closed_at ? dateFormat(closed_at) : null;

        setOrder({
          id: doc.id,
          patrimony,
          description,
          status,
          solution,
          when: dateFormat(created_at),
          closed,
        });

        setIsLoading(false);
      });
  }, []);

  if (!!isLoading) {
    return <Loading />;
  }

  return (
    <VStack flex={1} bg="gray.700">
      <Box px={6} bg="gray.600">
        <Header title="Solicitação" />
      </Box>

      <HStack bg="gray.500" justifyContent="center" p={4}>
        {order.status === "closed" ? (
          <CircleWavyCheck size={22} color={colors.green[300]} />
        ) : (
          <Hourglass size={22} color={colors.secondary[700]} />
        )}

        <Text
          fontSize="sm"
          color={
            order.status === "closed"
              ? colors.green[300]
              : colors.secondary[700]
          }
          ml={2}
          textTransform="uppercase"
        >
          {order.status === "closed" ? "finalizado" : "em andamento"}
        </Text>
      </HStack>

      <ScrollView mx={5} showsVerticalScrollIndicator={false}>
        <CardDetails
          title="equipamento"
          description={`Patrimônio ${order.patrimony}`}
          icon={DesktopTower}
          footer={order.when}
        />

        <CardDetails
          title="descrição do problema"
          description={order.description}
          icon={Clipboard}
        />

        <CardDetails
          title="solução"
          icon={CircleWavyCheck}
          description={order.solution}
          footer={order.closed && `Encerrado em ${order.closed}`}
        >
          {order.status === "open" && (
            <Input
              bg="gray.600"
              borderWidth={1}
              borderColor="gray.400"
              placeholder="Descrição da solução"
              textAlignVertical="top"
              multiline
              h={32}
              onChangeText={setSolution}
            />
          )}
        </CardDetails>
      </ScrollView>

      {order.status === "open" && (
        <Button
          title="Encerrar solicitação"
          m={5}
          isLoading={isLoading}
          onPress={handleOrderClose}
        />
      )}
    </VStack>
  );
}