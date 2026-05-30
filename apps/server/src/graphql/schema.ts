import { makeExecutableSchema } from "@graphql-tools/schema";
import { type QuizService, typeDefs } from "@quiz/core";
import type { GraphQLSchema } from "graphql";
import { createResolvers } from "./resolvers.js";

/** 共有 SDL（@quiz/core）とリゾルバから実行可能スキーマを組み立てる */
export function buildGraphQLSchema(service: QuizService): GraphQLSchema {
  return makeExecutableSchema({ typeDefs, resolvers: createResolvers(service) });
}
