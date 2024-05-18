import mysql from 'mysql2';
import { logger } from './logger';

let db;

class MySqlDB {
    constructor() {
        db = mysql.createConnection({ 
            host: 'localhost',
            user: "sultan",
            password: "123sultan321",
            database: "chat-api",
        });

        db.connect((error: Error | unknown) => {
            if (error) {
                console.log(error);
                logger.error(`Error in connecting MySql DB: ${error}`);
            }
        })
    }

    async createUser(data: any) {
        try {
            const userData = await this.getUser(data);

            if (userData.length) {
                logger.info(`User is alredy exist: ${userData[0]}. Will not create anything.`);
                return true;
            }

            await db.execute(`INSERT INTO user (first_name, user_id) VALUES (?,?)`, [data.firstName, data.id]);

        } catch(error: Error | unknown) {
            logger.error(`Error in createUser func: ${error}`);
        }
    }


    async getUser(bind: { firstName: string, id: number }) {
        try {
            const bindArr: string[] = [];
            let query: string = 'SELECT * FROM user', where_clause: string = '';
            
            if (bind.firstName) {
                where_clause = !where_clause.trim() ? ` where first_name = ?` : ` and first_name = ?`;
                bindArr.push(bind.firstName);
            }

            query += where_clause;

            const { rows: userData } = db.execute(query, bindArr);

            if (!userData.length) {
                throw new Error(`Error: User is not found.`)
            }

            return userData;

        } catch(error: Error | unknown) {
            logger.error(`Error in getUser func: ${error}`);
        }
    }

    async fetchMessage(bind: { firstName: string, id: number }) {
        try {
            let query: string = 'SELECT * from message', where_clause: string = '';
            const bindArr: (string | number)[] = [];

            if (bind.id) {
                where_clause = !where_clause.trim() ? ` where id = ?` : ` and id = ?`;
                bindArr.push(bind.id);
            }

            if (bind.firstName) {
                where_clause = !where_clause.trim() ? ` where first_name = ?` : ` and first_name = ?`;
                bindArr.push(bind.firstName);
            }

            query += where_clause;

            const { rows: messagesData } = await db.execute(query, [bind.firstName, bind.id]);

            if (!messagesData.length) {
                throw new Error(`Error: Messages were not found for user: ${JSON.stringify(bind)}.`)
            }

            return messagesData;

        } catch(error: Error | unknown) {
            logger.error(`Error in fetchMessage func: ${error}`);
        }
    }

    async createUserMessage(bind: {message: string, firstName: string, userId: number}) {
        try {
            await db.execute(`INSERT INTO message (message_text, first_name, user_id) VALUES (?,?, ?)`, [bind.message, bind.firstName, bind.userId]);
        } catch (error) {
            logger.error(`Error in createUserMessage func: ${error}`);
        }
    }
}

export default MySqlDB;