# Capstone RUNDING Back-End

Repository ini berisikan source code dari backend aplikasi RUNDING yang dibangun menggunakan Framework Express.Js. Front-End project capstone tersebut dapat diakses pada [Runding Front-End Web](https://github.com/Sitouxz/runding-web)

## Install Instructions
First clone this repository.
```bash
$ git clone https://github.com/tristanbeykusuma/capstone-runding-back-end.git
```

Install dependencies. Make sure you already have [`nodejs`](https://nodejs.org/en/) & [`npm`](https://www.npmjs.com/) installed in your system.
```bash
$ npm install # or yarn
```

Start the server
```bash
$ npm run start
```

## Kontrak API/Route

- Register New User : <br />
URL: "http://localhost:8080/user/register" <br />
Method: POST <br />
Headers : Content-Type: application/json <br />
Body : {"username" : string, "email": string, "password" : string} <br />
Response : <br />
{ status: 'ok', message: 'user created' }

- Login : <br />
URL: "http://localhost:8080/user/login" <br />
Method: POST <br />
Headers : Content-Type: application/json <br />
Body : {"username" : string, "password" : string} <br />
Response : <br />
{ status: 'ok', data: token (string type)} 

~ Token ini merupakan string yang dapat disimpan dalam local storage <br />

- Get Class Data Example : <br />
URL: "http://localhost:8080/getExampleData" <br />
Method: POST <br />
Headers : <br />
Content-Type: application/json<br />
auth-token: token (string type) <br />
Response : <br />
{   "status": "ok",
    "data": {
        "kelas": [
            "kelasdiskusi1",
            "kelasdiskusi2"
        ]
    }
 }

~ Field jenisRunding di model Runding meliputi : Sains, Teknologi, Programming, Agrikultur, Bisnis, Kesehatan, Debat, Hiburan, Kuliner, Olahraga dan Other <br />
- Get Daftar Semua Ruang Diskusi : <br />
URL: "http://localhost:8080/runding" <br />
Method: GET <br />
Headers : <br />
Content-Type: application/json<br />
auth-token: token (string type) <br />
Response : <br />
{   "status": "ok",
    "data": [datarunding]
}

- Get Daftar Ruang Diskusi Spesifik : <br />
URL: "http://localhost:8080/runding/:id" <br />
Method: GET <br />
Headers : <br />
Content-Type: application/json<br />
auth-token: token (string type) <br />
Response : <br />
{   "status": "ok",
    "data": datarunding (of id)
}

- Create Ruang Diskusi : <br />
URL: "http://localhost:8080/runding/ceate" <br />
Method: POST <br />
Headers : <br />
Content-Type: multipart/form-data<br />
auth-token: token (string type) <br />
Body :<br />
form-data (subject_form: string, deskripsi_form: string, logo_form: file(image), jenis_form: string) <br />
Response : <br />
{   "status": "ok",
    "message": "new group created"
    "data": datarunding (of id)
}
