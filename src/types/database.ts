export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      flights: {
        Row: {
          id: string
          flight_no: string
          origin: string
          destination: string
          departs_at: string
          arrives_at: string
          aircraft_type: string
          status: string
          base_price: number
        }
        Insert: {
          id?: string
          flight_no: string
          origin: string
          destination: string
          departs_at: string
          arrives_at: string
          aircraft_type: string
          status?: string
          base_price: number
        }
        Update: {
          id?: string
          flight_no?: string
          origin?: string
          destination?: string
          departs_at?: string
          arrives_at?: string
          aircraft_type?: string
          status?: string
          base_price?: number
        }
        Relationships: []
      }
      seats: {
        Row: {
          id: string
          flight_id: string
          seat_number: string
          class: 'first' | 'business' | 'economy'
          extra_fee: number
          is_available: boolean
        }
        Insert: {
          id?: string
          flight_id: string
          seat_number: string
          class: 'first' | 'business' | 'economy'
          extra_fee?: number
          is_available?: boolean
        }
        Update: {
          id?: string
          flight_id?: string
          seat_number?: string
          class?: 'first' | 'business' | 'economy'
          extra_fee?: number
          is_available?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "seats_flight_id_fkey"
            columns: ["flight_id"]
            referencedRelation: "flights"
            referencedColumns: ["id"]
          }
        ]
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          flight_id: string
          seat_id: string
          status: 'confirmed' | 'rescheduled' | 'cancelled'
          booked_at: string
          total_price: number
          pnr_code: string
        }
        Insert: {
          id?: string
          user_id: string
          flight_id: string
          seat_id: string
          status?: 'confirmed' | 'rescheduled' | 'cancelled'
          booked_at?: string
          total_price: number
          pnr_code: string
        }
        Update: {
          id?: string
          user_id?: string
          seat_id?: string
                    flight_id?: string
          status?: 'confirmed' | 'rescheduled' | 'cancelled'
          booked_at?: string
          total_price?: number
          pnr_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_flight_id_fkey"
            columns: ["flight_id"]
            referencedRelation: "flights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_seat_id_fkey"
            columns: ["seat_id"]
            referencedRelation: "seats"
            referencedColumns: ["id"]
          }
        ]
      }
      passengers: {
        Row: {
          id: string
          booking_id: string
          full_name: string
          passport_no: string
          nationality: string
          dob: string
        }
        Insert: {
          id?: string
          booking_id: string
          full_name: string
          passport_no: string
          nationality: string
          dob: string
        }
        Update: {
          id?: string
          booking_id?: string
          full_name?: string
          passport_no?: string
          nationality?: string
          dob?: string
        }
        Relationships: [
          {
            foreignKeyName: "passengers_booking_id_fkey"
            columns: ["booking_id"]
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          }
        ]
      }
      reschedules: {
        Row: {
          id: string
          booking_id: string
          old_flight_id: string
          new_flight_id: string
          rescheduled_at: string
          fee_paid: number
        }
        Insert: {
          id?: string
          booking_id: string
          old_flight_id: string
          new_flight_id: string
          rescheduled_at?: string
          fee_paid?: number
        }
        Update: {
          id?: string
          booking_id?: string
          old_flight_id?: string
          new_flight_id?: string
          rescheduled_at?: string
          fee_paid?: number
        }
        Relationships: [
          {
            foreignKeyName: "reschedules_booking_id_fkey"
            columns: ["booking_id"]
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_booking: {
        Args: {
          p_booking_id: string
          p_user_id: string
        }
        Returns: {
          success: boolean
          error: string
        }[]
      }
      reserve_seat: {
        Args: {
          p_user_id: string
          p_flight_id: string
          p_seat_id: string
          p_passenger_name: string
          p_passport_no: string
          p_nationality: string
          p_dob: string
          p_total_price: number
        }
        Returns: {
          success: boolean
          booking_id: string
          pnr_code: string
          error: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

