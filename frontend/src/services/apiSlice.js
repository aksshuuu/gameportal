import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://gameportal-backend.onrender.com/api",
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
    getTournaments: builder.query({
      query: () => "/tournaments",
      providesTags: ["Tournaments"],
    }),
    getProfile: builder.query({
      query: () => "/auth/me",
      providesTags: ["Profile"],
    }),
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
    }),
    createTournament: builder.mutation({
      query: (newTournament) => ({
        url: "/tournaments",
        method: "POST",
        body: newTournament,
      }),
      invalidatesTags: ["Tournaments"],
    }),
    deleteTournament: builder.mutation({
      query: (id) => ({
        url: `/tournaments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Tournaments"],
    }),
    joinTournament: builder.mutation({
      query: (id) => ({
        url: `/tournaments/${id}/join`,
        method: "POST",
      }),
      invalidatesTags: ["Tournaments"],
    }),
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