// Generouted, changes to this file will be overridden
/* eslint-disable */

import { components, hooks } from "@generouted/solid-router/client";

export type Path =
  | `/`
  | `/data`
  | `/encode/base64`
  | `/json/formatter`
  | `/nest`
  | `/nest/value`
  | `/utils/uuid`;

export type Params = {};

export type ModalPath = `/modal`;

export const { A, Navigate } = components<Path, Params>();
export const { useMatch, useModals, useNavigate, useParams } = hooks<
  Path,
  Params,
  ModalPath
>();
