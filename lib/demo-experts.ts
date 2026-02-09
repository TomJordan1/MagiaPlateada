/**
 * demo-experts.ts
 * ----------------
 * Datos de ejemplo (demo) de los expertos que se muestran en la app.
 * Estan separados del contexto global para mantener la logica de estado
 * limpia y facilitar la futura conexion con una base de datos real.
 *
 * Cada experto tiene: datos personales, servicio que ofrece,
 * modalidad (presencial/remoto), zona, horario, contacto y calificacion.
 */

import type { Expert } from "./app-context"

export const EXPERTOS_DEMO: Expert[] = [
  {
    id: "1",
    name: "Maria Elena Torres",
    age: 62,
    service: "Clases de cocina tradicional",
    experience: "30 anos de experiencia en gastronomia",
    modality: "presencial",
    zone: "Centro",
    schedule: "Lunes a Viernes, 10:00 - 14:00",
    contact: "+52 55 1234 5678",
    status: "available",
    rating: 4.8,
    totalRatings: 24,
    avatar: "ME",
  },
  {
    id: "2",
    name: "Roberto Sanchez Gil",
    age: 58,
    service: "Reparacion de electrodomesticos",
    experience: "35 anos como tecnico certificado",
    modality: "presencial",
    zone: "Norte",
    schedule: "Lunes a Sabado, 9:00 - 17:00",
    contact: "+52 55 2345 6789",
    status: "available",
    rating: 4.5,
    totalRatings: 18,
    avatar: "RS",
  },
  {
    id: "3",
    name: "Carmen Lucia Vega",
    age: 65,
    service: "Asesoria contable y fiscal",
    experience: "40 anos en contabilidad empresarial",
    modality: "remoto",
    zone: "Sur",
    schedule: "Martes y Jueves, 11:00 - 15:00",
    contact: "+52 55 3456 7890",
    status: "busy",
    rating: 4.9,
    totalRatings: 31,
    avatar: "CL",
  },
  {
    id: "4",
    name: "Jorge Alberto Mora",
    age: 70,
    service: "Clases de guitarra y musica",
    experience: "45 anos como musico profesional",
    modality: "ambos",
    zone: "Este",
    schedule: "Miercoles a Domingo, 16:00 - 20:00",
    contact: "+52 55 4567 8901",
    status: "available",
    rating: 4.7,
    totalRatings: 42,
    avatar: "JA",
  },
  {
    id: "5",
    name: "Patricia Mendez Ruiz",
    age: 55,
    service: "Costura y confeccion a medida",
    experience: "25 anos como modista independiente",
    modality: "presencial",
    zone: "Centro",
    schedule: "Lunes a Viernes, 8:00 - 13:00",
    contact: "+52 55 5678 9012",
    status: "available",
    rating: 4.6,
    totalRatings: 15,
    avatar: "PM",
  },
]
