import { Injectable } from '@angular/core';
import { NgxIndexedDBService } from 'ngx-indexed-db';

@Injectable({
  providedIn: 'root'
})
export class IndexDbService {
  databaseName = 'Lexicon';
  tableName = 'config';
  allItems: any = [];

  constructor(
    private dbService: NgxIndexedDBService
  ) {
    this.createDatabase();
  }


  public createDatabase() {
  }

  // Add value to table
  async addObject(key, value) {
    const data = {
      key,
      value
    };
    this.isExistKey(key, (isExist) => {
      if (isExist && isExist.length > 0) {
        this.updateObject(isExist[0].id, key, value);
      } else {
        this.dbService.add(this.tableName, data).then(() => {},error => {});
      }
    });
  }

    // Add value to table
  public addObjectWithS(key, value, cb) {
      const data = {
        key,
        value
      };
      this.getObject(key, (res) => {
        if (res) {
          this.dbService.update(this.tableName, {id: res.id, key, value}).then(() => {
            cb('');
          }, error => {
              console.log(error);
              cb('');
          });
        } else {
          this.dbService.add(this.tableName, data).then(() => {
            cb('');
          }, error => {
              console.log(error);
              cb('');
          });
        }
      });
    }


  public getObject(key, suc) {
    this.dbService.getAll(this.tableName).then(person => {
      const item = person.filter((x: any) => x.key === key);
      suc(item.length > 0 ? item[item.length - 1] : null);
    },error => { suc(null)});
  }

  public updateObject(id, key, value) {
    const data = {
      id,
      key,
      value
    };
    this.dbService.update(this.tableName, data).then(() => {}, error => {});
  }


  isExistKey(key: string, cb) {
    try {
      this.dbService.getAll(this.tableName).then(person => {
        cb(person.filter((x: any) => x.key === key));
      }, err => {
        cb(null);
      });
    } catch (err) {
    }
  }

  async removeObject(key) {
   this.isExistKey(key, (isExist) => {
     if (isExist && isExist.length > 0) {
       this.dbService.delete(this.tableName, isExist[0].id).then(() => {
        }, error => {
        });
     }
    });
  }

  public removeObjectWiths(key, cb) {
    this.dbService.getAll(this.tableName).then(resp => {
      const isExist: any = resp.filter((x: any) => x.key === key);
      if (isExist && isExist.length > 0) {
        this.dbService.delete(this.tableName, isExist[0].id).then(() => {
          cb('');
         }, error => {
          cb('');
         });
      } else {
        cb('');
      }
    }, err => {
      cb('');
    })
  }


  // Remove / Clear databse
  public clearDatabase() {
    this.dbService.clear(this.tableName).then(() => {}, error => {});
  }

}
