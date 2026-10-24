import logo from './logo.png';
import cart from './cart.jpeg';
import burger from './burger.png';
import pizza from './pizza.png';
import pasta from './pasta.png';
import salat from './salat.png';
import getraenke from './getraenke.png';
import dessert from './dessert.png';
import arabisches from './arabisches.png';
import userpfp from './userpfp.png';
import homee from './homee.png';
import homemask from './homemask.png';
import feature1 from './feature-1.svg';
import feature2 from './feature-2.svg';
import feature3 from './feature-3.svg';
import feature4 from './feature-4.svg';
import me from './me.png';
import me2 from './me2.png';
import profile3 from './profile-3.png';
import profile4 from './profile-4.png';
import pizzaMargherita from "./pizza_margherita.jpeg";
import pizzaFormaggi from "./pizza_formaggi.jpeg";
import pizzaTuna from "./pizza_tuna.jpeg";
import pastaChicken from "./pasta_chicken.jpeg";
import pastaBolognese from "./pasta_bolognese.jpeg";
import burgerSmashed from "./burger_smashed.jpeg";
import burgerChicken from "./burger_chicken.jpeg";
import arabicMansaf from "./arabic_mansaf.jpeg";
import arabicShawarma from "./arabic_shawarma.jpeg";
import saladCaesar from "./salad_caesar.jpeg";
import saladMozzarella from "./salad_mozzarella.jpeg";
import dessertTiramisu from "./dessert_tiramisu.jpeg";
import dessertCheesecake from "./dessert_cheesecake.jpeg";
import beverageCola from "./beverage_cola.jpeg";
import beverageOrange from "./beverage_orange.jpeg";




export const assets = {
    logo,       
    cart,
    userpfp,
    homee,
    homemask,
    feature1,
    feature2,
    feature3,
    feature4,
    me,
    me2,
    profile3,
    profile4,

    
};

export const categories = [

    {   
        category: 'Pizza',
        icon: pizza
    },
    {   
        category: 'Pasta',
        icon: pasta
    },

    {   
        category: 'Burger',
        icon: burger
    },

    {   
        category: 'Arabisches',
        icon: arabisches
    },

    {   
        category: 'Salat',
        icon: salat
    },

    {   
        category: 'Dessert',
        icon: dessert
    },

    {   
        category: 'Getränke',
        icon: getraenke
    },





];

const foodImageById = {
  "690e2c8f07cf0712c9d2f520": pizzaMargherita,
  "690e2cee07cf0712c9d2f521": pizzaFormaggi,
  "690e2d1c07cf0712c9d2f522": pizzaTuna,
  "690e2d8507cf0712c9d2f523": pastaChicken,
  "690e2e7f07cf0712c9d2f524": pastaBolognese,
  "690e2f3307cf0712c9d2f525": burgerSmashed,
  "690e2f8407cf0712c9d2f526": burgerChicken,
  "690e2ffc07cf0712c9d2f527": arabicMansaf,
  "690e305b07cf0712c9d2f528": arabicShawarma,
  "690e313507cf0712c9d2f529": saladCaesar,
  "690e318907cf0712c9d2f52a": saladMozzarella,
  "690e31c807cf0712c9d2f52b": dessertTiramisu,
  "690e320907cf0712c9d2f52c": dessertCheesecake,
  "690e549767a51140be05ddda": beverageCola,
  "690e564867a51140be05dddc": beverageOrange,
};

// Eigene Fotos für die Standard-Gerichte, sonst das im Admin-Panel hochgeladene Bild
export const getFoodImageById = (id, category, imageUrl) => {
  if (id && foodImageById[id]) return foodImageById[id];
  if (imageUrl) return imageUrl;
  return getFoodImageByCategory(category);
};

// Falls das hochgeladene Bild nicht lädt, Kategorie-Bild anzeigen
export const handleFoodImageError = (category) => (event) => {
  event.currentTarget.onerror = null;
  event.currentTarget.src = getFoodImageByCategory(category);
};

export const getFoodImageByCategory = (category) => {
  if (!category) return burger;

  const c = category.toLowerCase();

  if (c.includes("pizza")) return pizza;
  if (c.includes("pasta")) return pasta;
  if (c.includes("burger")) return burger;
  if (c.includes("salat") || c.includes("salad")) return salat;
  if (c.includes("dessert")) return dessert;
  if (c.includes("getraenk") || c.includes("getränk") || c.includes("beverage") || c.includes("drink")) return getraenke;
  if (c.includes("arab")) return arabisches;

  return burger;
};
