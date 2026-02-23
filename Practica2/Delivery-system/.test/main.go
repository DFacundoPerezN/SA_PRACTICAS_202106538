package main

import (
	"database/sql"
	"fmt"

	_ "github.com/denisenkom/go-mssqldb"
)

func main() {
	conn := "sqlserver://adminsql:Delivereats123@sa-delivereats.database.windows.net:1433?database=Delivereats_SA_Usuarios&encrypt=true"

	db, err := sql.Open("sqlserver", conn)
	if err != nil {
		panic(err)
	}

	err = db.Ping()
	if err != nil {
		panic(err)
	}

	fmt.Println("CONECTADO A AZURE SQL 🎉")
}
