import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type PassengerFormData = {
  full_name: string;
  passport_no: string;
  nationality: string;
  dob: string;
}

export type Flight = {
  id: string;
  flight_no: string;
  origin: string;
  destination: string;
  departs_at: string;
  arrives_at: string;
  aircraft_type: string;
  status: string;
  base_price: number;
}

export type Seat = {
  id: string;
  flight_id: string;
  seat_number: string;
  class: 'first' | 'business' | 'economy';
  extra_fee: number;
  is_available: boolean;
}

interface FlightStore {
  searchQuery: { origin: string; destination: string; date: string; passengers: number } | null;
  selectedFlight: Flight | null;
  selectedSeat: Seat | null;
  selectedSeats: Seat[];
  currentStep: 'search' | 'flights' | 'seats' | 'passenger' | 'confirmation';
  passengerData: PassengerFormData | null;
  passengerDataList: PassengerFormData[];
  
  setSearchQuery: (query: FlightStore['searchQuery']) => void;
  setSelectedFlight: (flight: Flight | null) => void;
  setSelectedSeat: (seat: Seat | null) => void;
  setSelectedSeats: (seats: Seat[]) => void;
  setPassengerData: (data: PassengerFormData | null) => void;
  setPassengerDataList: (list: PassengerFormData[]) => void;
  setCurrentStep: (step: FlightStore['currentStep']) => void;
  resetBooking: () => void;
}

export const useFlightStore = create<FlightStore>()(
  persist(
    (set) => ({
      searchQuery: null,
      selectedFlight: null,
      selectedSeat: null,
      selectedSeats: [],
      currentStep: 'search',
      passengerData: null,
      passengerDataList: [],
      
      setSearchQuery: (searchQuery) => set({ searchQuery, currentStep: 'flights' }),
      setSelectedFlight: (selectedFlight) => set({ selectedFlight, currentStep: 'seats' }),
      setSelectedSeat: (selectedSeat) => set({ selectedSeat }),
      setSelectedSeats: (selectedSeats) => set({ selectedSeats }),
      setPassengerData: (passengerData) => set({ passengerData }),
      setPassengerDataList: (passengerDataList) => set({ passengerDataList }),
      setCurrentStep: (currentStep) => set({ currentStep }),
      resetBooking: () => set({ 
        searchQuery: null,
        selectedFlight: null, 
        selectedSeat: null, 
        selectedSeats: [],
        currentStep: 'search',
        passengerData: null,
        passengerDataList: []
      }),
    }),
    {
      name: 'flight-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        selectedFlight: state.selectedFlight,
        selectedSeat: state.selectedSeat,
        selectedSeats: state.selectedSeats,
        currentStep: state.currentStep,
        passengerData: state.passengerData ? {
          ...state.passengerData,
          passport_no: '' 
        } : null,
        passengerDataList: state.passengerDataList ? state.passengerDataList.map(p => ({
          ...p,
          passport_no: ''
        })) : []
      }),
      skipHydration: true,
    }
  )
)
