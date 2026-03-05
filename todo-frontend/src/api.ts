import axios from "axios";
import type { TodoItem, CreateTodoRequest, UpdateTodoRequest } from "./types";

const client = axios.create({
  baseURL: "http://localhost:5227/api",
  headers: { "Content-Type": "application/json" },
});

export const api = {
  getAll: () => client.get<TodoItem[]>("/todos").then((r) => r.data),
  create: (req: CreateTodoRequest) =>
    client.post<TodoItem>("/todos", req).then((r) => r.data),
  update: (id: number, req: UpdateTodoRequest) =>
    client.put<TodoItem>(`/todos/${id}`, req).then((r) => r.data),
  toggle: (id: number) =>
    client.patch<TodoItem>(`/todos/${id}/toggle`).then((r) => r.data),
  delete: (id: number) => client.delete(`/todos/${id}`),
};
