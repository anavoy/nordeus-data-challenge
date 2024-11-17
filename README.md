# Nordeus Challenge

### Installation
```
npm install
npx prisma generate
npx prisma migrate deploy
```

### Loading data into the database
```
npm run data:load
```
This command will load data from `data` directory into the database.


### Clearing data from database
```
npm run data:clear
```
This command will clear data database.



### Running the API server
```
npm run api
```
Will start API server on `http://localhost:3000`

### Endpoints
You can see endpoints on `http://localhost:3000/docs`


### User stats examples
Player with id `5e1cbb73-e3a5-36eb-d522-24c3f785af01`
On day `2024/10/24` has one session and has played one match which was a draw.
```
POST http://localhost:3000/v1/user?user_id=5e1cbb73-e3a5-36eb-d522-24c3f785af01&date=2024/10/24
{
  "data": {
    "user": {
      "country": "IT",
      "registration_time": "2024-10-16T21:12:18.000Z"
    },
    "stats": {
      "days_since_last_login": 1,
      "session_count": 1,
      "matches": {
        "wins": 0,
        "draws": 1,
        "losses": 0
      },
      "points": 1,
      "timeSpentInMatchesPercentage": 24
    }
  }
}
```
