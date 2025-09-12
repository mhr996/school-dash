SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', 'a9a73bde-c872-4e41-a247-68291b0edee5', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"school@demo.com","user_id":"722a4221-bf79-431d-b12c-3733633de0d4","user_phone":""}}', '2025-09-09 09:53:35.33957+00', ''),
	('00000000-0000-0000-0000-000000000000', '7e7ce219-5305-4a02-8f93-62caeace2691', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"school@demo.com","user_id":"722a4221-bf79-431d-b12c-3733633de0d4","user_phone":""}}', '2025-09-09 09:54:07.807678+00', ''),
	('00000000-0000-0000-0000-000000000000', '00c706f5-031a-43da-aea8-642151cfbf3b', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"demo@demo.com","user_id":"94ed61e5-2d41-4c3d-94b5-d8223a81a859","user_phone":""}}', '2025-09-09 09:54:24.892111+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b64dd92c-fbf4-4ed9-ba80-872298b4a22a', '{"action":"login","actor_id":"94ed61e5-2d41-4c3d-94b5-d8223a81a859","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-09 09:54:34.179634+00', ''),
	('00000000-0000-0000-0000-000000000000', '6b50bae2-539a-4f24-9c59-9c465eb045af', '{"action":"token_refreshed","actor_id":"94ed61e5-2d41-4c3d-94b5-d8223a81a859","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 10:53:13.839355+00', ''),
	('00000000-0000-0000-0000-000000000000', '93dc066f-ec79-4d83-994f-566e637c5eb0', '{"action":"token_revoked","actor_id":"94ed61e5-2d41-4c3d-94b5-d8223a81a859","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 10:53:13.84903+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c94508e7-7a06-4eb2-8adb-00b1d3e9d215', '{"action":"login","actor_id":"94ed61e5-2d41-4c3d-94b5-d8223a81a859","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-09 11:44:48.902513+00', ''),
	('00000000-0000-0000-0000-000000000000', '6814318c-de34-4101-b227-1f3e992ee856', '{"action":"login","actor_id":"94ed61e5-2d41-4c3d-94b5-d8223a81a859","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-09 12:30:25.870022+00', ''),
	('00000000-0000-0000-0000-000000000000', '5c15a826-0a54-4ce2-975f-1432c1bc0f55', '{"action":"login","actor_id":"94ed61e5-2d41-4c3d-94b5-d8223a81a859","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-09 12:34:41.617055+00', ''),
	('00000000-0000-0000-0000-000000000000', '13a4db3b-19db-4ed5-8604-5e2264ea74d5', '{"action":"login","actor_id":"94ed61e5-2d41-4c3d-94b5-d8223a81a859","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-09 12:41:37.525923+00', ''),
	('00000000-0000-0000-0000-000000000000', '2c5e1585-0bfe-4a9b-a5e0-cbce41a418b2', '{"action":"login","actor_id":"94ed61e5-2d41-4c3d-94b5-d8223a81a859","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-09 13:04:08.700567+00', ''),
	('00000000-0000-0000-0000-000000000000', '03958d4a-57ae-4620-ad77-40c031dd8886', '{"action":"token_refreshed","actor_id":"94ed61e5-2d41-4c3d-94b5-d8223a81a859","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 13:37:42.362945+00', ''),
	('00000000-0000-0000-0000-000000000000', '1ce5b9e3-60a7-4266-af08-4b8ace5f30e7', '{"action":"token_revoked","actor_id":"94ed61e5-2d41-4c3d-94b5-d8223a81a859","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 13:37:42.36884+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e418ac46-661c-4c27-867a-cf30d3a69cc5', '{"action":"token_refreshed","actor_id":"94ed61e5-2d41-4c3d-94b5-d8223a81a859","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 13:40:31.00822+00', ''),
	('00000000-0000-0000-0000-000000000000', '26e7b5e4-64c3-4f23-9b18-dc47bca0c2a5', '{"action":"token_revoked","actor_id":"94ed61e5-2d41-4c3d-94b5-d8223a81a859","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 13:40:31.009847+00', ''),
	('00000000-0000-0000-0000-000000000000', '678671a3-8ea0-446b-9bd7-907ae2534b0a', '{"action":"token_refreshed","actor_id":"94ed61e5-2d41-4c3d-94b5-d8223a81a859","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 14:15:06.415106+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c60c8e42-873d-4f6e-8048-67eb13681600', '{"action":"token_revoked","actor_id":"94ed61e5-2d41-4c3d-94b5-d8223a81a859","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 14:15:06.437134+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f2c5785b-5264-4f61-8d79-0b3409f0abb8', '{"action":"token_refreshed","actor_id":"94ed61e5-2d41-4c3d-94b5-d8223a81a859","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 19:36:41.401605+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd14dca33-8040-4a4f-ac0f-6fe1b83e4745', '{"action":"token_revoked","actor_id":"94ed61e5-2d41-4c3d-94b5-d8223a81a859","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 19:36:41.428136+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd8841577-fc90-4893-a86c-95dde9b1649a', '{"action":"token_refreshed","actor_id":"94ed61e5-2d41-4c3d-94b5-d8223a81a859","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-10 06:08:07.507863+00', ''),
	('00000000-0000-0000-0000-000000000000', '7547105b-44e3-481f-b526-db2e6aab99d7', '{"action":"token_revoked","actor_id":"94ed61e5-2d41-4c3d-94b5-d8223a81a859","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-10 06:08:07.52914+00', ''),
	('00000000-0000-0000-0000-000000000000', '88196f61-5230-4feb-a01d-49e7959ab313', '{"action":"token_refreshed","actor_id":"94ed61e5-2d41-4c3d-94b5-d8223a81a859","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-10 08:45:45.909772+00', ''),
	('00000000-0000-0000-0000-000000000000', '302bb5b5-9333-45ab-8bda-494eeef1bb65', '{"action":"token_revoked","actor_id":"94ed61e5-2d41-4c3d-94b5-d8223a81a859","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-10 08:45:45.921737+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd42a1956-6fbf-4089-97e7-63f5ff98c2c3', '{"action":"token_refreshed","actor_id":"94ed61e5-2d41-4c3d-94b5-d8223a81a859","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-10 09:47:06.61596+00', ''),
	('00000000-0000-0000-0000-000000000000', '57cf8bbc-dfdd-4a9d-b80b-55cab349d8c5', '{"action":"token_revoked","actor_id":"94ed61e5-2d41-4c3d-94b5-d8223a81a859","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-10 09:47:06.642253+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c684a401-b1e0-4a85-8e3e-dd5deaf95926', '{"action":"user_confirmation_requested","actor_id":"226ebb1f-e6ce-4cad-ae74-22215c1248bf","actor_name":"Mark MHR","actor_username":"markmhr96@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-09-10 10:04:12.494391+00', ''),
	('00000000-0000-0000-0000-000000000000', '0d38685f-1dda-40b8-a19e-1b3fd8646f82', '{"action":"logout","actor_id":"94ed61e5-2d41-4c3d-94b5-d8223a81a859","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"account"}', '2025-09-10 10:20:00.181864+00', ''),
	('00000000-0000-0000-0000-000000000000', '0acb3999-3a57-4965-8704-e9c7ebcd2f76', '{"action":"user_confirmation_requested","actor_id":"226ebb1f-e6ce-4cad-ae74-22215c1248bf","actor_name":"Mark MHR","actor_username":"markmhr96@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-09-10 10:45:26.59448+00', ''),
	('00000000-0000-0000-0000-000000000000', '597a247d-caff-48e7-a441-fdd901bf3a3d', '{"action":"user_confirmation_requested","actor_id":"226ebb1f-e6ce-4cad-ae74-22215c1248bf","actor_name":"Mark MHR","actor_username":"markmhr96@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-09-10 10:50:04.63523+00', ''),
	('00000000-0000-0000-0000-000000000000', '59079d6f-89a2-45af-91d8-cd20c0926952', '{"action":"user_recovery_requested","actor_id":"226ebb1f-e6ce-4cad-ae74-22215c1248bf","actor_name":"Mark MHR","actor_username":"markmhr96@gmail.com","actor_via_sso":false,"log_type":"user"}', '2025-09-10 10:54:42.074675+00', ''),
	('00000000-0000-0000-0000-000000000000', 'de24c304-005a-439e-a517-30dea0b895cb', '{"action":"user_signedup","actor_id":"226ebb1f-e6ce-4cad-ae74-22215c1248bf","actor_name":"Mark MHR","actor_username":"markmhr96@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-09-10 10:55:15.166968+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f77d3b72-c7b4-42dd-91ad-d6e89a942781', '{"action":"login","actor_id":"226ebb1f-e6ce-4cad-ae74-22215c1248bf","actor_name":"Mark MHR","actor_username":"markmhr96@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-10 10:56:52.218005+00', ''),
	('00000000-0000-0000-0000-000000000000', '5762eeae-34ce-448e-bf10-5c2322be5a99', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"demo@demo.com","user_id":"94ed61e5-2d41-4c3d-94b5-d8223a81a859","user_phone":""}}', '2025-09-10 10:57:24.671478+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd0bdfacc-4743-4c2c-b166-0274dc5e6262', '{"action":"logout","actor_id":"226ebb1f-e6ce-4cad-ae74-22215c1248bf","actor_name":"Mark MHR","actor_username":"markmhr96@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-09-10 10:57:30.023408+00', ''),
	('00000000-0000-0000-0000-000000000000', '0146ab1f-033d-48cc-b21d-34d1480c1e12', '{"action":"user_confirmation_requested","actor_id":"fae3714b-646e-49b6-9faa-36ba1994e367","actor_name":"Maher Orabi","actor_username":"tombson.m@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-09-10 11:02:36.109597+00', ''),
	('00000000-0000-0000-0000-000000000000', '715397ab-0c5f-42a6-a787-3fd6e05942ef', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"demo@demo.com","user_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","user_phone":""}}', '2025-09-10 11:03:53.79904+00', ''),
	('00000000-0000-0000-0000-000000000000', '42296d5d-9074-46e7-b523-9cfee5f01268', '{"action":"user_confirmation_requested","actor_id":"bf77d479-69cc-427c-8a46-c6034f30365a","actor_name":"Mahhher Orabi","actor_username":"tombson.mm@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-09-10 11:11:55.737018+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ed7e9ea7-9b35-45d1-80a0-70af76eb8bdd', '{"action":"login","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-10 11:54:06.932741+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f6a15b1c-11f4-41b8-98bc-ee0744517e5a', '{"action":"login","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-10 12:13:11.412948+00', ''),
	('00000000-0000-0000-0000-000000000000', '25d1f3d4-256b-436a-8aea-96dca55d58de', '{"action":"user_confirmation_requested","actor_id":"8826ffd4-7716-421f-8018-0e1efc6d7d88","actor_username":"tombgson.mm@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-09-10 12:57:32.790774+00', ''),
	('00000000-0000-0000-0000-000000000000', '4ffc5ecd-75f4-4dd6-a94e-be38a07ee8c7', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"tombgson.mm@gmail.com","user_id":"8826ffd4-7716-421f-8018-0e1efc6d7d88","user_phone":""}}', '2025-09-10 13:10:08.817498+00', ''),
	('00000000-0000-0000-0000-000000000000', '8d032031-1429-4da1-8f9f-a5d301f74698', '{"action":"token_refreshed","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-10 13:11:19.844708+00', ''),
	('00000000-0000-0000-0000-000000000000', '3e6770fd-ac21-4f99-868d-dbeea75ff767', '{"action":"token_revoked","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-10 13:11:19.84613+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fd10a297-d725-41e4-9c0b-7a8f5cf06007', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"tombson.mm@gmail.com","user_id":"bf77d479-69cc-427c-8a46-c6034f30365a","user_phone":""}}', '2025-09-10 13:20:42.629046+00', ''),
	('00000000-0000-0000-0000-000000000000', '19f95d17-91ac-443c-8594-aee67c8c2361', '{"action":"user_confirmation_requested","actor_id":"ebc1e860-08d4-40e4-b6b7-9e2a91ce8059","actor_username":"ahmed123@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-09-10 13:31:36.607819+00', ''),
	('00000000-0000-0000-0000-000000000000', '257ecc16-52cc-49e5-ba2d-25fbc64fa2f5', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"markmhr96@gmail.com","user_id":"226ebb1f-e6ce-4cad-ae74-22215c1248bf","user_phone":""}}', '2025-09-10 13:33:06.769362+00', ''),
	('00000000-0000-0000-0000-000000000000', '5af6979d-46ab-420c-818c-a125771b6b72', '{"action":"token_refreshed","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-10 17:46:18.271019+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a36e106a-7816-4b2f-8d9a-64d62cfcd814', '{"action":"token_revoked","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-10 17:46:18.296548+00', ''),
	('00000000-0000-0000-0000-000000000000', '6b98983a-5ac6-40dc-91d0-47eb2bcb31ca', '{"action":"token_refreshed","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-10 17:50:25.475507+00', ''),
	('00000000-0000-0000-0000-000000000000', '9fa44d8d-02b9-4922-9c6e-28c3e3a0ef71', '{"action":"token_revoked","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-10 17:50:25.484003+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cbe45c8c-0262-4900-9060-9e9059ea3bb0', '{"action":"login","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-10 19:23:04.788762+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e9d062ab-e2dc-4c6a-8ec6-ee8b64ace4fc', '{"action":"token_refreshed","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-10 19:23:59.00801+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd2f78b97-b211-4b1e-b10d-1b92057d601d', '{"action":"token_revoked","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-10 19:23:59.008825+00', ''),
	('00000000-0000-0000-0000-000000000000', '593f0662-1f29-42cc-b1bb-75c9b6a85ec9', '{"action":"login","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-10 19:25:18.276979+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd74e91a9-9b57-4d91-aee1-6f4b3b479c32', '{"action":"token_refreshed","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-11 08:18:02.69535+00', ''),
	('00000000-0000-0000-0000-000000000000', 'aa4e1ff9-1d58-4c95-bc24-7310b3083bbc', '{"action":"token_revoked","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-11 08:18:02.70457+00', ''),
	('00000000-0000-0000-0000-000000000000', '47f20527-c41c-4a4a-811b-9da5e19844cf', '{"action":"token_refreshed","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-11 09:11:13.913652+00', ''),
	('00000000-0000-0000-0000-000000000000', '9b38fbaa-be95-4d71-9f04-13affc653cce', '{"action":"token_revoked","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-11 09:11:13.925394+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a2bab2e9-a936-44ea-9e14-79f5cf3af69a', '{"action":"token_refreshed","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-11 09:51:36.495494+00', ''),
	('00000000-0000-0000-0000-000000000000', '49e0ede9-8752-48c2-97db-3f4d3f22dc4b', '{"action":"token_revoked","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-11 09:51:36.519231+00', ''),
	('00000000-0000-0000-0000-000000000000', '0030df7d-5953-4ab8-b0d6-61d1dbd8d9b7', '{"action":"token_refreshed","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-11 11:03:18.410706+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f65cadd2-a8a5-40a2-8ae5-d0ffbec96e63', '{"action":"token_revoked","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-11 11:03:18.422123+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ff0e38aa-2ef4-48a4-9cef-47f9e691032c', '{"action":"token_refreshed","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-11 12:43:24.325616+00', ''),
	('00000000-0000-0000-0000-000000000000', '43989ea1-8849-48dc-8306-a01bb88f11ec', '{"action":"token_revoked","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-11 12:43:24.350969+00', ''),
	('00000000-0000-0000-0000-000000000000', '86609212-3bd3-4efa-b2b8-afe65a8e9562', '{"action":"token_refreshed","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-11 16:34:26.683101+00', ''),
	('00000000-0000-0000-0000-000000000000', '5200f7c0-2ca6-4099-8ab0-7f0137537288', '{"action":"token_revoked","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-11 16:34:26.703862+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b73f332f-bd85-4f13-9153-2a3a000995aa', '{"action":"token_refreshed","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-11 16:53:02.058012+00', ''),
	('00000000-0000-0000-0000-000000000000', '609bf3fb-2e2b-4987-a2a7-0f968c0dfbf0', '{"action":"token_revoked","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-11 16:53:02.066721+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b9310fc4-86be-4c96-bfe3-2786728a1542', '{"action":"token_refreshed","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-11 18:08:05.207747+00', ''),
	('00000000-0000-0000-0000-000000000000', '2730d200-d0f8-41b6-b127-a8dbd06e22dc', '{"action":"token_revoked","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-11 18:08:05.225164+00', ''),
	('00000000-0000-0000-0000-000000000000', '73ed4ccd-5923-4669-9344-be90e266c28a', '{"action":"token_refreshed","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-11 19:05:47.772374+00', ''),
	('00000000-0000-0000-0000-000000000000', '55c53b47-9d2c-4c88-b741-b0d2427bb722', '{"action":"token_revoked","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-11 19:05:47.7846+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a6857e37-44a9-4e68-a8bf-f59d63ef99d8', '{"action":"login","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-11 20:13:58.847984+00', ''),
	('00000000-0000-0000-0000-000000000000', '734d8e03-dfc1-40ac-a4b8-f3896fffa786', '{"action":"token_refreshed","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-12 09:56:09.100696+00', ''),
	('00000000-0000-0000-0000-000000000000', '631424a0-6ef7-4625-9b39-160b632544c1', '{"action":"token_revoked","actor_id":"d670d2ac-a32e-429c-a165-bba0c2cbb2a3","actor_username":"demo@demo.com","actor_via_sso":false,"log_type":"token"}', '2025-09-12 09:56:09.128979+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'fae3714b-646e-49b6-9faa-36ba1994e367', 'authenticated', 'authenticated', 'tombson.m@gmail.com', '$2a$10$i3Lg7NnkY54uPfG5BE55pueDEk80l9Hj9l6227D/5F48FauEFcfAu', NULL, NULL, '64b422698c16c9ef99b5ab6774cd2d4ad9854d071cf3fa13c5eab1a8', '2025-09-10 11:02:36.110054+00', '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"sub": "fae3714b-646e-49b6-9faa-36ba1994e367", "email": "tombson.m@gmail.com", "full_name": "Maher Orabi", "email_verified": false, "phone_verified": false}', NULL, '2025-09-10 11:02:36.104259+00', '2025-09-10 11:02:36.511543+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'd670d2ac-a32e-429c-a165-bba0c2cbb2a3', 'authenticated', 'authenticated', 'demo@demo.com', '$2a$10$PGF0xBNmT4ZeUyGH9TUEpeWHZmAv6zvAl/.zOka3MGsbs/eZsm/FW', '2025-09-10 11:03:53.801803+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-09-11 20:13:58.872678+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2025-09-10 11:03:53.794092+00', '2025-09-12 09:56:09.169675+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'ebc1e860-08d4-40e4-b6b7-9e2a91ce8059', 'authenticated', 'authenticated', 'ahmed123@gmail.com', '$2a$10$IyN9VdMEM/3qjQnP4.XsSOGwZjf3lwDHebHI.lw/Sy0RVhxO7g8Le', NULL, NULL, 'd9f052cdeb6daddbb14a101ab7f5f478b60edbae5d66596a5c14f7a5', '2025-09-10 13:31:36.608951+00', '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"sub": "ebc1e860-08d4-40e4-b6b7-9e2a91ce8059", "email": "ahmed123@gmail.com", "email_verified": false, "phone_verified": false}', NULL, '2025-09-10 13:31:36.598278+00', '2025-09-10 13:31:37.139298+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('fae3714b-646e-49b6-9faa-36ba1994e367', 'fae3714b-646e-49b6-9faa-36ba1994e367', '{"sub": "fae3714b-646e-49b6-9faa-36ba1994e367", "email": "tombson.m@gmail.com", "full_name": "Maher Orabi", "email_verified": false, "phone_verified": false}', 'email', '2025-09-10 11:02:36.106747+00', '2025-09-10 11:02:36.106792+00', '2025-09-10 11:02:36.106792+00', '8914473c-1ff4-40c0-a442-485214ae5f69'),
	('d670d2ac-a32e-429c-a165-bba0c2cbb2a3', 'd670d2ac-a32e-429c-a165-bba0c2cbb2a3', '{"sub": "d670d2ac-a32e-429c-a165-bba0c2cbb2a3", "email": "demo@demo.com", "email_verified": false, "phone_verified": false}', 'email', '2025-09-10 11:03:53.798101+00', '2025-09-10 11:03:53.798154+00', '2025-09-10 11:03:53.798154+00', '9fd9cfa4-2042-417b-9f45-d6a46eab9553'),
	('ebc1e860-08d4-40e4-b6b7-9e2a91ce8059', 'ebc1e860-08d4-40e4-b6b7-9e2a91ce8059', '{"sub": "ebc1e860-08d4-40e4-b6b7-9e2a91ce8059", "email": "ahmed123@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2025-09-10 13:31:36.60324+00', '2025-09-10 13:31:36.60329+00', '2025-09-10 13:31:36.60329+00', '4a5ceae6-3f78-48a3-97e6-b9481a5a5641');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag") VALUES
	('fafd29fa-8d7a-45e7-8139-0ad023205650', 'd670d2ac-a32e-429c-a165-bba0c2cbb2a3', '2025-09-10 12:13:11.42581+00', '2025-09-12 09:56:09.177369+00', NULL, 'aal1', NULL, '2025-09-12 09:56:09.177292', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '185.7.130.90', NULL),
	('dd2c3186-df6f-4a9a-9d5a-8c82171146c0', 'd670d2ac-a32e-429c-a165-bba0c2cbb2a3', '2025-09-10 19:25:18.278607+00', '2025-09-10 19:25:18.278607+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '185.142.40.132', NULL),
	('d160e9ca-db96-40e4-b728-b90ed5a0e8d4', 'd670d2ac-a32e-429c-a165-bba0c2cbb2a3', '2025-09-10 11:54:06.958198+00', '2025-09-11 18:08:05.263055+00', NULL, 'aal1', NULL, '2025-09-11 18:08:05.262453', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '79.177.136.96', NULL),
	('42b8a73f-9979-4371-a673-21b6ba021a77', 'd670d2ac-a32e-429c-a165-bba0c2cbb2a3', '2025-09-10 19:23:04.809848+00', '2025-09-11 19:05:47.809347+00', NULL, 'aal1', NULL, '2025-09-11 19:05:47.808372', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '109.67.157.146', NULL),
	('ebe1f7b0-a48f-414b-93cd-f9c9d0119be5', 'd670d2ac-a32e-429c-a165-bba0c2cbb2a3', '2025-09-11 20:13:58.873601+00', '2025-09-11 20:13:58.873601+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '109.67.157.146', NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('d160e9ca-db96-40e4-b728-b90ed5a0e8d4', '2025-09-10 11:54:07.008296+00', '2025-09-10 11:54:07.008296+00', 'password', '919aade3-fc7b-4024-a4ae-15aa443cd147'),
	('fafd29fa-8d7a-45e7-8139-0ad023205650', '2025-09-10 12:13:11.443239+00', '2025-09-10 12:13:11.443239+00', 'password', '814e8323-02b8-456f-ad33-d00a8cea6e18'),
	('42b8a73f-9979-4371-a673-21b6ba021a77', '2025-09-10 19:23:04.848104+00', '2025-09-10 19:23:04.848104+00', 'password', '5eb81643-4210-426b-9c67-860715146188'),
	('dd2c3186-df6f-4a9a-9d5a-8c82171146c0', '2025-09-10 19:25:18.281388+00', '2025-09-10 19:25:18.281388+00', 'password', '9919a280-63a6-4936-a68b-619cc33ecc39'),
	('ebe1f7b0-a48f-414b-93cd-f9c9d0119be5', '2025-09-11 20:13:58.921642+00', '2025-09-11 20:13:58.921642+00', 'password', '5a576b14-28bb-48e6-8c7c-014330e2d614');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."one_time_tokens" ("id", "user_id", "token_type", "token_hash", "relates_to", "created_at", "updated_at") VALUES
	('055a2115-a8d3-483d-8b7e-1040855eb597', 'fae3714b-646e-49b6-9faa-36ba1994e367', 'confirmation_token', '64b422698c16c9ef99b5ab6774cd2d4ad9854d071cf3fa13c5eab1a8', 'tombson.m@gmail.com', '2025-09-10 11:02:36.513256', '2025-09-10 11:02:36.513256'),
	('6ea16533-00ff-4302-8253-14d1f7eb19c5', 'ebc1e860-08d4-40e4-b6b7-9e2a91ce8059', 'confirmation_token', 'd9f052cdeb6daddbb14a101ab7f5f478b60edbae5d66596a5c14f7a5', 'ahmed123@gmail.com', '2025-09-10 13:31:37.147902', '2025-09-10 13:31:37.147902');


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 18, 'utl2bz2bisw2', 'd670d2ac-a32e-429c-a165-bba0c2cbb2a3', true, '2025-09-10 12:13:11.432776+00', '2025-09-10 13:11:19.84678+00', NULL, 'fafd29fa-8d7a-45e7-8139-0ad023205650'),
	('00000000-0000-0000-0000-000000000000', 19, 'vtuz3fvlf6f2', 'd670d2ac-a32e-429c-a165-bba0c2cbb2a3', true, '2025-09-10 13:11:19.857766+00', '2025-09-10 17:46:18.298351+00', 'utl2bz2bisw2', 'fafd29fa-8d7a-45e7-8139-0ad023205650'),
	('00000000-0000-0000-0000-000000000000', 17, 'e3hie4ruebab', 'd670d2ac-a32e-429c-a165-bba0c2cbb2a3', true, '2025-09-10 11:54:06.977198+00', '2025-09-10 17:50:25.485896+00', NULL, 'd160e9ca-db96-40e4-b728-b90ed5a0e8d4'),
	('00000000-0000-0000-0000-000000000000', 20, 'bmwwjexrwyq2', 'd670d2ac-a32e-429c-a165-bba0c2cbb2a3', true, '2025-09-10 17:46:18.321838+00', '2025-09-10 19:23:59.013595+00', 'vtuz3fvlf6f2', 'fafd29fa-8d7a-45e7-8139-0ad023205650'),
	('00000000-0000-0000-0000-000000000000', 24, 'g3fjjteqbt7b', 'd670d2ac-a32e-429c-a165-bba0c2cbb2a3', false, '2025-09-10 19:25:18.279445+00', '2025-09-10 19:25:18.279445+00', NULL, 'dd2c3186-df6f-4a9a-9d5a-8c82171146c0'),
	('00000000-0000-0000-0000-000000000000', 23, 'oz44gzvuw47h', 'd670d2ac-a32e-429c-a165-bba0c2cbb2a3', true, '2025-09-10 19:23:59.014766+00', '2025-09-11 08:18:02.706373+00', 'bmwwjexrwyq2', 'fafd29fa-8d7a-45e7-8139-0ad023205650'),
	('00000000-0000-0000-0000-000000000000', 21, '3zogallpi6oo', 'd670d2ac-a32e-429c-a165-bba0c2cbb2a3', true, '2025-09-10 17:50:25.488441+00', '2025-09-11 09:11:13.926029+00', 'e3hie4ruebab', 'd160e9ca-db96-40e4-b728-b90ed5a0e8d4'),
	('00000000-0000-0000-0000-000000000000', 25, '5bpplngycyxb', 'd670d2ac-a32e-429c-a165-bba0c2cbb2a3', true, '2025-09-11 08:18:02.71805+00', '2025-09-11 09:51:36.520533+00', 'oz44gzvuw47h', 'fafd29fa-8d7a-45e7-8139-0ad023205650'),
	('00000000-0000-0000-0000-000000000000', 27, 'jvoseuhnpkgf', 'd670d2ac-a32e-429c-a165-bba0c2cbb2a3', true, '2025-09-11 09:51:36.545052+00', '2025-09-11 11:03:18.423464+00', '5bpplngycyxb', 'fafd29fa-8d7a-45e7-8139-0ad023205650'),
	('00000000-0000-0000-0000-000000000000', 28, '7tszreva6c3b', 'd670d2ac-a32e-429c-a165-bba0c2cbb2a3', true, '2025-09-11 11:03:18.435227+00', '2025-09-11 12:43:24.352185+00', 'jvoseuhnpkgf', 'fafd29fa-8d7a-45e7-8139-0ad023205650'),
	('00000000-0000-0000-0000-000000000000', 26, 'lwwlezsu5f4c', 'd670d2ac-a32e-429c-a165-bba0c2cbb2a3', true, '2025-09-11 09:11:13.932896+00', '2025-09-11 16:34:26.706324+00', '3zogallpi6oo', 'd160e9ca-db96-40e4-b728-b90ed5a0e8d4'),
	('00000000-0000-0000-0000-000000000000', 29, 'fwolmo4vfxgm', 'd670d2ac-a32e-429c-a165-bba0c2cbb2a3', true, '2025-09-11 12:43:24.374312+00', '2025-09-11 16:53:02.06797+00', '7tszreva6c3b', 'fafd29fa-8d7a-45e7-8139-0ad023205650'),
	('00000000-0000-0000-0000-000000000000', 30, 'ochzt4p3vokg', 'd670d2ac-a32e-429c-a165-bba0c2cbb2a3', true, '2025-09-11 16:34:26.725619+00', '2025-09-11 18:08:05.227564+00', 'lwwlezsu5f4c', 'd160e9ca-db96-40e4-b728-b90ed5a0e8d4'),
	('00000000-0000-0000-0000-000000000000', 32, 'y2w54ezgycop', 'd670d2ac-a32e-429c-a165-bba0c2cbb2a3', false, '2025-09-11 18:08:05.244455+00', '2025-09-11 18:08:05.244455+00', 'ochzt4p3vokg', 'd160e9ca-db96-40e4-b728-b90ed5a0e8d4'),
	('00000000-0000-0000-0000-000000000000', 22, '3dnob4lwyflg', 'd670d2ac-a32e-429c-a165-bba0c2cbb2a3', true, '2025-09-10 19:23:04.825126+00', '2025-09-11 19:05:47.786225+00', NULL, '42b8a73f-9979-4371-a673-21b6ba021a77'),
	('00000000-0000-0000-0000-000000000000', 33, 'klce5irzjs4k', 'd670d2ac-a32e-429c-a165-bba0c2cbb2a3', false, '2025-09-11 19:05:47.796362+00', '2025-09-11 19:05:47.796362+00', '3dnob4lwyflg', '42b8a73f-9979-4371-a673-21b6ba021a77'),
	('00000000-0000-0000-0000-000000000000', 34, 'xmj5eiwb3ypg', 'd670d2ac-a32e-429c-a165-bba0c2cbb2a3', false, '2025-09-11 20:13:58.893999+00', '2025-09-11 20:13:58.893999+00', NULL, 'ebe1f7b0-a48f-414b-93cd-f9c9d0119be5'),
	('00000000-0000-0000-0000-000000000000', 31, 'bw2x23wsem7a', 'd670d2ac-a32e-429c-a165-bba0c2cbb2a3', true, '2025-09-11 16:53:02.071713+00', '2025-09-12 09:56:09.129657+00', 'fwolmo4vfxgm', 'fafd29fa-8d7a-45e7-8139-0ad023205650'),
	('00000000-0000-0000-0000-000000000000', 35, 'ulhbcacjsmxt', 'd670d2ac-a32e-429c-a165-bba0c2cbb2a3', false, '2025-09-12 09:56:09.157727+00', '2025-09-12 09:56:09.157727+00', 'bw2x23wsem7a', 'fafd29fa-8d7a-45e7-8139-0ad023205650');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: buses; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: company_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."company_settings" ("name", "logo_url", "address", "phone", "tax_number", "id", "created_at", "updated_at", "email") VALUES
	('School', 'https://gpsaahyywcjztqfuebge.supabase.co/storage/v1/object/public/company/logo/logo.png', '', '', '', 'a52009d0-5107-4576-8674-e54b7f50f99e', '2025-09-09 10:18:16.943+00', '2025-09-09 10:34:10.378+00', NULL);


--
-- Data for Name: schools; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."schools" ("id", "created_at", "updated_at", "name", "code", "type", "director_name", "address", "email", "phone", "staff_count", "student_count", "class_count", "status", "notes") VALUES
	('6d967a20-1906-4cfc-b9a8-4f1753df1fc1', '2025-09-10 13:25:46.22+00', '2025-09-10 13:25:46.22+00', 'School Of Tech', 'SOF', 'مدرسة', 'Samer', 'address', '', '45345463', 30, 400, 8, 'active', 'notes');


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: travel_companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."travel_companies" ("id", "name", "code", "services_offered", "vehicle_count", "vehicle_availability", "accounting_methods", "address", "email", "phone", "status", "notes", "created_at", "updated_at", "pricing_data") VALUES
	('41e0b8cc-ffbb-4c13-8a6c-1671acc46811', 'הסעות הדרום בע"מ', '345345', 'خدمات', 30, 'available', 'يدوي', 'address', 'travel@gmail.com', '434234322', 'active', 'ملاحظات', '2025-09-11 11:08:46.615221+00', '2025-09-11 20:20:30.699995+00', '{"فان": {"الناصره وضواحيها": 45}, "خاصة": {"الجولان وضواحيها": 25}, "باص 40": {"الجنوب": 54}, "باص 50": {"حيفا وضواحيها": 44}, "مينيبوس 18": {"العربة": 65}, "مينيبوس 24": {"ايلات": 99}}'),
	('44895ee4-7bbd-4661-996c-738a3c2b501a', 'נתיבי באר שבע', 'RAH001', 'نقل الطلاب، رحلات مدرسية، نقل المعلمين', 15, 'available', 'محاسبة شهرية، دفع مقدم', 'شارع الملك فهد، الرياض، المملكة العربية السعودية', 'info@rahaltransport.com', '+966112345678', 'active', NULL, '2025-09-11 09:07:00.744366+00', '2025-09-11 20:20:44.31347+00', NULL),
	('cfbacdb2-a736-4f9d-82c1-1c3ce291997c', 'א.א  הסעות', 'STAR002', 'خدمات النقل المدرسي، رحلات ترفيهية', 8, 'available', 'دفع ربع سنوي', 'طريق الدمام، جدة، المملكة العربية السعودية', 'contact@goldenstar.sa', '+966126789012', 'active', NULL, '2025-09-11 09:07:00.744366+00', '2025-09-11 20:21:21.14154+00', NULL),
	('be356cc4-d139-407e-a477-332de72a970a', 'הסעות ים המלח', 'FAST003', 'نقل يومي للطلاب، خدمات النقل الخاص', 12, 'available', 'محاسبة يومية، دفع نقدي', 'شارع العليا، الدمام، المملكة العربية السعودية', 'admin@fastroute.com.sa', '+966138901234', 'active', NULL, '2025-09-11 09:07:00.744366+00', '2025-09-11 20:21:36.104451+00', NULL);


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_roles" ("id", "name", "description", "created_at", "updated_at") VALUES
	(1, 'admin', 'System administrator with full access', '2025-09-09 12:06:46.176607+00', '2025-09-10 10:18:52.091339+00'),
	(2, 'employee', 'General employee with limited access', '2025-09-09 12:06:46.176607+00', '2025-09-10 10:18:52.091339+00'),
	(3, 'school_manager', 'School manager with school-specific access', '2025-09-09 12:06:46.176607+00', '2025-09-10 10:18:52.091339+00'),
	(4, 'trip_planner', 'Trip planner with trip management access', '2025-09-09 12:06:46.176607+00', '2025-09-10 10:18:52.091339+00');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."users" ("id", "created_at", "updated_at", "email", "phone", "status", "avatar_url", "last_login_at", "auth_user_id", "full_name", "birth_date", "address", "role_id", "school_id", "is_active") VALUES
	('fae3714b-646e-49b6-9faa-36ba1994e367', '2025-09-10 11:02:36.747716+00', '2025-09-10 11:02:36.747716+00', 'tombson.m@gmail.com', NULL, 'active', NULL, NULL, 'fae3714b-646e-49b6-9faa-36ba1994e367', 'Maher Orabi', NULL, NULL, 2, NULL, true),
	('d670d2ac-a32e-429c-a165-bba0c2cbb2a3', '2025-09-10 11:04:45.520751+00', '2025-09-10 11:04:45.520751+00', 'demo@demo.com', NULL, 'active', NULL, NULL, 'd670d2ac-a32e-429c-a165-bba0c2cbb2a3', 'Demo', NULL, NULL, 1, NULL, true),
	('fcaaaab2-4032-452d-8d4d-592743c3bf1f', '2025-09-10 13:31:37.408808+00', '2025-09-10 13:31:37.408808+00', 'ahmed123@gmail.com', '4534552343', 'active', NULL, NULL, 'ebc1e860-08d4-40e4-b6b7-9e2a91ce8059', 'Ahmed', NULL, NULL, 3, '6d967a20-1906-4cfc-b9a8-4f1753df1fc1', true);


--
-- Data for Name: trips; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: trip_buses; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: trip_registrations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES
	('company', 'company', NULL, '2025-09-09 10:22:26.230406+00', '2025-09-09 10:22:26.230406+00', true, false, NULL, NULL, NULL, 'STANDARD');


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata", "level") VALUES
	('35ef45de-5043-41d5-b84b-4b93b4ccd165', 'company', 'logo/logo.png', '94ed61e5-2d41-4c3d-94b5-d8223a81a859', '2025-09-09 10:33:34.548292+00', '2025-09-09 18:00:56.587593+00', '2025-09-09 10:33:34.548292+00', '{"eTag": "\"0fff61efe3e0644bebd72b994de5461b\"", "size": 94304, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2025-09-09T10:33:35.000Z", "contentLength": 94304, "httpStatusCode": 200}', '8dae72ed-1901-4d39-81bc-e2aefde41b7c', '94ed61e5-2d41-4c3d-94b5-d8223a81a859', '{}', 2);


--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."prefixes" ("bucket_id", "name", "created_at", "updated_at") VALUES
	('company', 'logo', '2025-09-09 18:00:56.094377+00', '2025-09-09 18:00:56.094377+00');


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 35, true);


--
-- Name: user_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."user_roles_id_seq"', 4, true);


--
-- PostgreSQL database dump complete
--

RESET ALL;
