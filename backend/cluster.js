import cluster from "node:cluster";
import os from "node:os";
import process from "node:process";
import { initCron } from "./lib/fetchData";

if (cluster.isPrimary) {
  initCron();
  for (let i = 0; i < os.availableParallelism(); i++) cluster.fork();
} else {
  await import("./index");
  console.log(`Worker ${process.pid} started`);
}
