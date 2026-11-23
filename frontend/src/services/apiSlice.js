
import {
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";

// Use the same backend URL as services/api.js
const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://gameportal-backend.onrender.com/api"
    : "http://localhost:5000/api")
).replace(/\/+$/, "");

export const apiSlice = createApi({
  reducerPath: "api",

  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,

    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");

      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),

  tagTypes: ["Tournaments", "Profile"],

  endpoints: (builder) => ({
    // GET ALL TOURNAMENTS
    getTournaments: builder.query({
      query: () => "/tournaments",
      providesTags: ["Tournaments"],
    }),

    // GET CURRENT USER PROFILE
    getProfile: builder.query({
      query: () => "/auth/me",
      providesTags: ["Profile"],
    }),

    // LOGIN
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Profile"],
    }),

    // REGISTER PLAYER / ORGANIZER
    register: builder.mutation({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["Profile"],
    }),

    // CREATE TOURNAMENT
    createTournament: builder.mutation({
      query: (newTournament) => ({
        url: "/tournaments",
        method: "POST",
        body: newTournament,
      }),
      invalidatesTags: ["Tournaments"],
    }),

    // DELETE TOURNAMENT
    deleteTournament: builder.mutation({
      query: (id) => ({
        url: `/tournaments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Tournaments"],
    }),

    // JOIN TOURNAMENT
    joinTournament: builder.mutation({
      query: (id) => ({
        url: `/tournaments/${id}/join`,
        method: "POST",
      }),
      invalidatesTags: ["Tournaments"],
    }),

    // UNREGISTER FROM TOURNAMENT
    unregisterTournament: builder.mutation({
      query: (id) => ({
        url: `/tournaments/${id}/unregister`,
        method: "POST",
      }),
      invalidatesTags: ["Tournaments"],
    }),
  }),
});

export const {
  useGetTournamentsQuery,
  useGetProfileQuery,
  useLoginMutation,
  useRegisterMutation,
  useCreateTournamentMutation,
  useDeleteTournamentMutation,
  useJoinTournamentMutation,
  useUnregisterTournamentMutation,
} = apiSlice;
