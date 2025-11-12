import { Kafka, logLevel } from "kafkajs";
import { config } from "../../config/env";
import { logger } from "../../utils/logger";
import { prisma } from "../../config/db";

const MATCH_TOPIC = "scheduling.match.scheduled.v1";

export class MatchEventConsumer {
  private kafka?: Kafka;

  async start(): Promise<void> {
    if (!config.KAFKA_BROKERS) {
      logger.info("Kafka brokers not configured; match event consumer disabled");
      return;
    }

    this.kafka = new Kafka({
      clientId: config.KAFKA_CLIENT_ID,
      brokers: config.KAFKA_BROKERS.split(","),
      logLevel: logLevel.NOTHING,
    });

    const consumer = this.kafka.consumer({
      groupId: config.KAFKA_CONSUMER_GROUP,
    });

    await consumer.connect();
    await consumer.subscribe({ topic: MATCH_TOPIC, fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;
        try {
          const event = JSON.parse(message.value.toString());
          await this.handleMatchScheduled(event);
        } catch (error) {
          logger.error({ err: error }, "Failed to process match scheduled event");
        }
      },
    });

    process.on("SIGTERM", async () => {
      await consumer.disconnect();
    });
    process.on("SIGINT", async () => {
      await consumer.disconnect();
    });

    logger.info("Match event consumer started");
  }

  private async handleMatchScheduled(event: any): Promise<void> {
    const payload = event?.payload;
    if (!payload?.matchId) {
      logger.warn("Match event missing matchId; skipping");
      return;
    }

    const title = `${payload.homeTeam?.name ?? "Home"} vs ${payload.awayTeam?.name ?? "Away"}`;
    const description = payload.competition?.name ?? "Auto-generated market";

    const category = await prisma.category.upsert({
      where: { title: "Auto Generated" },
      update: {},
      create: { title: "Auto Generated" },
    });

    await prisma.bet.upsert({
      where: {
        externalMatchId: payload.matchId,
      },
      update: {
        title,
        description,
        metadata: payload,
      },
      create: {
        title,
        description,
        status: "open",
        categoryId: category.id,
        externalMatchId: payload.matchId,
        metadata: payload,
        odds: {
          create: [
            {
              title: payload.homeTeam?.name ?? "Home",
              value: 1.8,
            },
            {
              title: payload.awayTeam?.name ?? "Away",
              value: 2.0,
            },
            {
              title: "Draw",
              value: 3.1,
            },
          ],
        },
      },
    });

    logger.info({ matchId: payload.matchId }, "Synchronized match into betting market");
  }
}
