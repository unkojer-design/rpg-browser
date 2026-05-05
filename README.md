# RPG Browser — Multijoueur en temps réel

Jeu RPG jouable dans le navigateur avec jusqu'à 4 amis simultanément.

## Stack
- **Frontend** : React + Phaser 3 + TailwindCSS + Vite
- **Backend** : Node.js + Express + Socket.io
- **Base de données** : SQLite (better-sqlite3)

## Installation

```bash
# Depuis le dossier rpg-browser/
npm run install:all
```

Ou manuellement :
```bash
cd server && npm install
cd ../client && npm install
```

## Lancement (développement)

```bash
# Dans rpg-browser/ — lance client ET serveur
npm run dev
```

- **Client** : http://localhost:5173
- **Serveur** : http://localhost:3001

## Fonctionnalités
- Inscription / connexion avec mot de passe hashé (bcrypt + JWT)
- Création de personnage : 4 classes (Guerrier, Mage, Voleur, Paladin)
- Monde partagé temps réel (Socket.io) — tous les joueurs se voient
- 12 mobs sur la map, cliquables pour déclencher un combat
- Système de combat tour par tour avec compétences par classe
- Chat en temps réel entre joueurs connectés
- Sauvegarde automatique de la position et de l'état du personnage
- Système de niveaux et XP

## Commandes ZQSD/WASD ou Flèches pour se déplacer
