

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."update_travel_companies_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_travel_companies_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."buses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "bus_number" character varying(50) NOT NULL,
    "license_plate" character varying(20) NOT NULL,
    "capacity" integer DEFAULT 50 NOT NULL,
    "model" character varying(100),
    "year" integer,
    "insurance_policy_number" character varying(100),
    "insurance_expiry_date" "date",
    "last_maintenance_date" "date",
    "next_maintenance_date" "date",
    "fuel_type" character varying(20) DEFAULT 'diesel'::character varying,
    "status" character varying(20) DEFAULT 'available'::character varying,
    "gps_tracking_id" character varying(100),
    "safety_features" "text",
    "notes" "text"
);


ALTER TABLE "public"."buses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_settings" (
    "name" character varying NOT NULL,
    "logo_url" "text",
    "address" "text",
    "phone" character varying,
    "tax_number" character varying,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "email" "text"
);


ALTER TABLE "public"."company_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schools" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "name" character varying NOT NULL,
    "code" character varying,
    "type" character varying NOT NULL,
    "director_name" character varying,
    "address" "text",
    "email" character varying,
    "phone" character varying,
    "staff_count" integer DEFAULT 0,
    "student_count" integer DEFAULT 0,
    "class_count" integer DEFAULT 0,
    "status" character varying DEFAULT 'active'::character varying,
    "notes" "text"
);


ALTER TABLE "public"."schools" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."students" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "student_id" character varying(50) NOT NULL,
    "first_name" character varying(100) NOT NULL,
    "last_name" character varying(100) NOT NULL,
    "email" character varying(255),
    "phone" character varying(20),
    "date_of_birth" "date",
    "grade_level" character varying(20),
    "class_section" character varying(20),
    "parent_guardian_name" character varying(255),
    "parent_guardian_phone" character varying(20),
    "parent_guardian_email" character varying(255),
    "emergency_contact_name" character varying(255),
    "emergency_contact_phone" character varying(20),
    "medical_conditions" "text",
    "allergies" "text",
    "address" "text",
    "status" character varying(20) DEFAULT 'active'::character varying,
    "avatar_url" "text",
    "notes" "text"
);


ALTER TABLE "public"."students" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."travel_companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "code" character varying(50) NOT NULL,
    "services_offered" "text",
    "vehicle_count" integer DEFAULT 0,
    "vehicle_availability" character varying(50) DEFAULT 'available'::character varying,
    "accounting_methods" "text",
    "address" "text" NOT NULL,
    "email" character varying(255) NOT NULL,
    "phone" character varying(50) NOT NULL,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "pricing_data" "jsonb",
    CONSTRAINT "check_status" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::"text"[]))),
    CONSTRAINT "check_vehicle_availability" CHECK ((("vehicle_availability")::"text" = ANY ((ARRAY['available'::character varying, 'busy'::character varying, 'maintenance'::character varying])::"text"[])))
);


ALTER TABLE "public"."travel_companies" OWNER TO "postgres";


COMMENT ON TABLE "public"."travel_companies" IS 'Travel companies that provide transportation services for schools';



COMMENT ON COLUMN "public"."travel_companies"."accounting_methods" IS 'Description of how the company handles accounting and payments';



CREATE TABLE IF NOT EXISTS "public"."trip_buses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "trip_id" "uuid",
    "bus_id" "uuid",
    "driver_id" "uuid",
    "departure_time" time without time zone,
    "return_time" time without time zone,
    "route_details" "text"
);


ALTER TABLE "public"."trip_buses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_registrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "trip_id" "uuid",
    "student_id" "uuid",
    "registration_date" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "payment_status" character varying(20) DEFAULT 'unpaid'::character varying,
    "amount_paid" numeric(10,2) DEFAULT 0,
    "payment_method" character varying(50),
    "special_requirements" "text",
    "parent_consent" boolean DEFAULT false,
    "medical_form_submitted" boolean DEFAULT false,
    "emergency_contact_confirmed" boolean DEFAULT false,
    "registered_by" "uuid",
    "approved_by" "uuid"
);


ALTER TABLE "public"."trip_registrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trips" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "trip_name" character varying(255) NOT NULL,
    "description" "text",
    "destination" character varying(255) NOT NULL,
    "departure_date" "date" NOT NULL,
    "return_date" "date" NOT NULL,
    "departure_time" time without time zone,
    "return_time" time without time zone,
    "max_students" integer DEFAULT 30,
    "cost_per_student" numeric(10,2) DEFAULT 0,
    "grade_levels" character varying(100),
    "trip_type" character varying(50) DEFAULT 'educational'::character varying,
    "status" character varying(20) DEFAULT 'planning'::character varying,
    "meeting_point" character varying(255),
    "emergency_contact" character varying(255),
    "special_requirements" "text",
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."trips" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" integer NOT NULL,
    "name" character varying(50) NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_roles" IS 'RLS disabled - using frontend role-based access control instead';



CREATE SEQUENCE IF NOT EXISTS "public"."user_roles_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."user_roles_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_roles_id_seq" OWNED BY "public"."user_roles"."id";



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "email" character varying(255) NOT NULL,
    "phone" character varying(20),
    "status" character varying(20) DEFAULT 'active'::character varying,
    "avatar_url" "text",
    "last_login_at" timestamp with time zone,
    "auth_user_id" "uuid",
    "full_name" character varying(200),
    "birth_date" "date",
    "address" "text",
    "role_id" integer,
    "school_id" "uuid",
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON TABLE "public"."users" IS 'RLS disabled - using frontend role-based access control instead';



ALTER TABLE ONLY "public"."user_roles" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_roles_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."buses"
    ADD CONSTRAINT "buses_bus_number_key" UNIQUE ("bus_number");



ALTER TABLE ONLY "public"."buses"
    ADD CONSTRAINT "buses_license_plate_key" UNIQUE ("license_plate");



ALTER TABLE ONLY "public"."buses"
    ADD CONSTRAINT "buses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_settings"
    ADD CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schools"
    ADD CONSTRAINT "schools_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."schools"
    ADD CONSTRAINT "schools_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_student_id_key" UNIQUE ("student_id");



ALTER TABLE ONLY "public"."travel_companies"
    ADD CONSTRAINT "travel_companies_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."travel_companies"
    ADD CONSTRAINT "travel_companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trip_buses"
    ADD CONSTRAINT "trip_buses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trip_buses"
    ADD CONSTRAINT "trip_buses_trip_id_bus_id_key" UNIQUE ("trip_id", "bus_id");



ALTER TABLE ONLY "public"."trip_registrations"
    ADD CONSTRAINT "trip_registrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trip_registrations"
    ADD CONSTRAINT "trip_registrations_trip_id_student_id_key" UNIQUE ("trip_id", "student_id");



ALTER TABLE ONLY "public"."trips"
    ADD CONSTRAINT "trips_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_buses_status" ON "public"."buses" USING "btree" ("status");



CREATE INDEX "idx_schools_code" ON "public"."schools" USING "btree" ("code");



CREATE INDEX "idx_schools_name" ON "public"."schools" USING "btree" ("name");



CREATE INDEX "idx_schools_status" ON "public"."schools" USING "btree" ("status");



CREATE INDEX "idx_schools_type" ON "public"."schools" USING "btree" ("type");



CREATE INDEX "idx_students_grade_level" ON "public"."students" USING "btree" ("grade_level");



CREATE INDEX "idx_students_student_id" ON "public"."students" USING "btree" ("student_id");



CREATE INDEX "idx_travel_companies_code" ON "public"."travel_companies" USING "btree" ("code");



CREATE INDEX "idx_travel_companies_name" ON "public"."travel_companies" USING "btree" ("name");



CREATE INDEX "idx_travel_companies_status" ON "public"."travel_companies" USING "btree" ("status");



CREATE INDEX "idx_travel_companies_vehicle_availability" ON "public"."travel_companies" USING "btree" ("vehicle_availability");



CREATE INDEX "idx_trip_registrations_status" ON "public"."trip_registrations" USING "btree" ("status");



CREATE INDEX "idx_trip_registrations_student_id" ON "public"."trip_registrations" USING "btree" ("student_id");



CREATE INDEX "idx_trip_registrations_trip_id" ON "public"."trip_registrations" USING "btree" ("trip_id");



CREATE INDEX "idx_trips_departure_date" ON "public"."trips" USING "btree" ("departure_date");



CREATE INDEX "idx_trips_status" ON "public"."trips" USING "btree" ("status");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_is_active" ON "public"."users" USING "btree" ("is_active");



CREATE INDEX "idx_users_role_id" ON "public"."users" USING "btree" ("role_id");



CREATE INDEX "idx_users_school_id" ON "public"."users" USING "btree" ("school_id");



CREATE INDEX "idx_users_status" ON "public"."users" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "travel_companies_updated_at_trigger" BEFORE UPDATE ON "public"."travel_companies" FOR EACH ROW EXECUTE FUNCTION "public"."update_travel_companies_updated_at"();



CREATE OR REPLACE TRIGGER "update_user_roles_updated_at" BEFORE UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."trip_buses"
    ADD CONSTRAINT "trip_buses_bus_id_fkey" FOREIGN KEY ("bus_id") REFERENCES "public"."buses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_buses"
    ADD CONSTRAINT "trip_buses_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."trip_buses"
    ADD CONSTRAINT "trip_buses_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_registrations"
    ADD CONSTRAINT "trip_registrations_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."trip_registrations"
    ADD CONSTRAINT "trip_registrations_registered_by_fkey" FOREIGN KEY ("registered_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."trip_registrations"
    ADD CONSTRAINT "trip_registrations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_registrations"
    ADD CONSTRAINT "trip_registrations_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trips"
    ADD CONSTRAINT "trips_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."trips"
    ADD CONSTRAINT "trips_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."user_roles"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id");



CREATE POLICY "Allow authenticated users to modify company settings" ON "public"."company_settings" TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to modify schools" ON "public"."schools" TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read company settings" ON "public"."company_settings" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read schools" ON "public"."schools" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read buses" ON "public"."buses" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can read students" ON "public"."students" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can read trip buses" ON "public"."trip_buses" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can read trip registrations" ON "public"."trip_registrations" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can read trips" ON "public"."trips" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."update_travel_companies_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_travel_companies_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_travel_companies_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."buses" TO "anon";
GRANT ALL ON TABLE "public"."buses" TO "authenticated";
GRANT ALL ON TABLE "public"."buses" TO "service_role";



GRANT ALL ON TABLE "public"."company_settings" TO "anon";
GRANT ALL ON TABLE "public"."company_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."company_settings" TO "service_role";



GRANT ALL ON TABLE "public"."schools" TO "anon";
GRANT ALL ON TABLE "public"."schools" TO "authenticated";
GRANT ALL ON TABLE "public"."schools" TO "service_role";



GRANT ALL ON TABLE "public"."students" TO "anon";
GRANT ALL ON TABLE "public"."students" TO "authenticated";
GRANT ALL ON TABLE "public"."students" TO "service_role";



GRANT ALL ON TABLE "public"."travel_companies" TO "anon";
GRANT ALL ON TABLE "public"."travel_companies" TO "authenticated";
GRANT ALL ON TABLE "public"."travel_companies" TO "service_role";



GRANT ALL ON TABLE "public"."trip_buses" TO "anon";
GRANT ALL ON TABLE "public"."trip_buses" TO "authenticated";
GRANT ALL ON TABLE "public"."trip_buses" TO "service_role";



GRANT ALL ON TABLE "public"."trip_registrations" TO "anon";
GRANT ALL ON TABLE "public"."trip_registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."trip_registrations" TO "service_role";



GRANT ALL ON TABLE "public"."trips" TO "anon";
GRANT ALL ON TABLE "public"."trips" TO "authenticated";
GRANT ALL ON TABLE "public"."trips" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_roles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_roles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_roles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
