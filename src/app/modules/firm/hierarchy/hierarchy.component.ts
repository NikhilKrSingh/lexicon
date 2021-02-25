import { Component, OnInit } from '@angular/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { finalize, map, shareReplay } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { vwPracticeAreaList } from 'src/common/models/vwPracticeAreaList';
import { vwEchelon, vwHierarchy } from 'src/common/swagger-providers/models';
import { EchelonService, HierarchyService, OfficeService, TenantService } from 'src/common/swagger-providers/services';
import { vwEcheloneUsage, vwLocalEchelon, vwLocalHierarchy } from '../../models/firm-hierarchy.model';
import { Tenant } from '../../models/firm-settinngs.model';
import { vwOfficeEchelon } from '../../models/vw-office-echelon';
import * as errors from '../../shared/error.json';
import { CreateCustomHierarchyLevelComponent } from './custom-level/custom-level.component';
import { CreateCustomHierarchyNodeComponent } from './custom-node/custom-node.component';
import { DeleteHierarchyLevelComponent } from './delete-level/delete-level.component';
import { DeleteHierarchyNodeComponent } from './delete-node/delete-node.component';

@Component({
  selector: 'app-hierarchy',
  templateUrl: './hierarchy.component.html',
  styleUrls: ['./hierarchy.component.scss']
})
export class HierarchyComponent implements OnInit {
  firmDetails: Tenant;
  originalFirmHierarchy: vwLocalHierarchy[];
  firmHierarchy: vwLocalHierarchy[];
  practiceAreaList: vwPracticeAreaList[];
  selectedLevelAndId: {
    [level: number]: number;
  };
  private officeChache$: {
    [id: number]: Observable<Array<vwEchelon>>;
  };
  modalOptions: NgbModalOptions;
  closeResult: string;
  error_data = (errors as any).default;
  maxLevel = 0;
  minLevel = 0;

  constructor(
    private hierarchyService: HierarchyService,
    private tenantService: TenantService,
    private modalService: NgbModal,
    private toaster: ToastDisplay,
    private echelonService: EchelonService,
    private officeService: OfficeService
  ) {
    this.firmHierarchy = [];
    this.originalFirmHierarchy = [];
    this.selectedLevelAndId = {};
    this.officeChache$ = {};
    this.modalOptions = {
      centered: true,
      backdrop: 'static',
      keyboard: false
    };
  }

  ngOnInit() {
    this.getTenantData();
    this.getHierarchyData();
    this.getPracticeAreas();
  }

  private getTenantData() {
    this.tenantService
      .v1TenantGet({})
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as Tenant;
        }),
        finalize(() => {
        })
      )
      .subscribe(res => {
        this.firmDetails = res;
      });
  }

  private getHierarchyData() {
    this.hierarchyService
      .v1HierarchyGet({})
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as vwLocalHierarchy[];
        }),
        finalize(() => {
        })
      )
      .subscribe(res => {
        this.originalFirmHierarchy = res;
        if (
          this.originalFirmHierarchy &&
          this.originalFirmHierarchy.length > 0
        ) {
          let max_level = _.maxBy(this.originalFirmHierarchy, a => a.level);
          this.maxLevel = max_level.level + 1;

          this.minLevel = _.minBy(
            this.originalFirmHierarchy,
            a => a.level
          ).level;
        } else {
          this.maxLevel = 1;
          this.minLevel = 1;
        }

        this.originalFirmHierarchy.push({
          id: 0,
          level: this.maxLevel,
          name: 'Office',
          description: null,
          echelons: []
        });

        this.prepareData();
      });
  }

  private prepareData() {
    this.firmHierarchy = JSON.parse(JSON.stringify(this.originalFirmHierarchy));
    let keys = Object.keys(this.selectedLevelAndId);
    this.firmHierarchy.forEach((a, i) => {
      if (i > 0) {
        a.echelons = [];
      }
    });

    if (keys.length > 0) {
      keys.forEach((level, index) => {
        if (index + 1 < this.originalFirmHierarchy.length) {
          let parentId = +this.selectedLevelAndId[level];

          let echelons = this.originalFirmHierarchy[index + 1].echelons.filter(
            a => a.parentId == parentId
          );

          this.firmHierarchy[index].echelons.forEach(e => {
            if (e.id == parentId) {
              e.isSelected = true;
            } else {
              e.isSelected = false;
            }
          });

          if (+level == this.maxLevel - 1) {
            this.getOfficeEchelons(parentId, index);
          } else {
            this.firmHierarchy[index + 1].echelons = echelons;
            this.firmHierarchy[index + 1].echelons.forEach(e => {
              e.isSelected = false;
            });
          }
        }
      });
    }
  }

  private getOfficeEchelons(id: number, index: number) {
    if (!this.officeChache$[id]) {
      this.officeChache$[id] = this.officeService
        .v1OfficeEchelonEchelonIdGet({
          echelonId: id
        })
        .pipe(
          map(res => {
            return JSON.parse(res as any).results as vwOfficeEchelon[];
          }),
          map(res => {
            return res.map(r => {
              return {
                id: r.officeId,
                name: r.officeName,
                parentId: r.parentId,
                parentName: r.parentName
              } as vwEchelon;
            });
          }),
          shareReplay()
        );
    }

    this.officeChache$[id].subscribe(echelons => {
      this.firmHierarchy[index + 1].echelons = echelons;
      this.firmHierarchy[index + 1].echelons.forEach(e => {
        e.isSelected = false;
      });
    });
  }

  public selectHierarchyLevel(echelon: vwLocalEchelon, level: number) {
    if (level < this.maxLevel) {
      this.selectedLevelAndId[level] = echelon.id;
      Object.keys(this.selectedLevelAndId).forEach(a => {
        if (+a > level) {
          delete this.selectedLevelAndId[a];
        }
      });
      this.prepareData();
    }
  }

  private getPracticeAreas() {
    this.tenantService
      .v1TenantPracticeAreaGet()
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as vwPracticeAreaList[];
        })
      )
      .subscribe(res => {
        this.practiceAreaList = res;
      });
  }

  public viewFullHierarchy() {
  }

  public addNewHierarchyLevel() {
    // 6 => because 1 level is firm and office is always last level so we can only create 5 custom levels
    if (this.firmHierarchy && this.firmHierarchy.length < 6) {
      let modelRef = this.modalService.open(
        CreateCustomHierarchyLevelComponent,
        this.modalOptions
      );
      let component = modelRef.componentInstance;
      component.firmHierarchy = this.originalFirmHierarchy;
      component.firmDetails = this.firmDetails;
      component.hierarchy = {
        level: this.maxLevel
      };
      modelRef.result.then(res => {
        if (res) {
          this.hierarchyService
            .v1HierarchyPost$Json({
              body: res
            })
            .pipe(
              map(response => {
                return JSON.parse(response as any).results;
              })
            )
            .subscribe(
              () => {
                this.toaster.showSuccess(
                  this.error_data.add_hierarchy_level_success
                );
                this.getHierarchyData();
              },
              () => {
              }
            );
        }
      });
    } else {
      this.toaster.showError(this.error_data.max_hierarchy_level_added);
    }
  }

  public editHierarchyLevel(hierarchy: vwLocalHierarchy) {
    let modelRef = this.modalService.open(
      CreateCustomHierarchyLevelComponent,
      this.modalOptions
    );

    let component = modelRef.componentInstance;
    component.hierarchy = { ...hierarchy };
    component.firmDetails = this.firmDetails;
    component.firmHierarchy = this.firmHierarchy;

    modelRef.result.then(res => {
      if (res) {
        this.hierarchyService
          .v1HierarchyPut$Json({
            body: res
          })
          .pipe(
            map(response => {
              return JSON.parse(response as any).results;
            })
          )
          .subscribe(
            () => {
              this.toaster.showSuccess(this.error_data.edit_hierarchy_level_success);
              this.getHierarchyData();
            },
            () => {
            }
          );
      }
    });
  }

  public deleteHierarchyLevel(hierarchy: vwLocalHierarchy) {
    let echelons = this.originalFirmHierarchy.find(
      a => a.level == hierarchy.level
    ).echelons;
    if (echelons.length > 0) {
      this.echelonService
        .v1EchelonCheckUsagePost$Json({
          body: echelons.map(a => a.id)
        })
        .pipe(
          map(response => {
            return JSON.parse(response as any).results as vwEcheloneUsage[];
          }),
          finalize(() => {
          })
        )
        .subscribe(res => {
          this.deleteLevel(res, hierarchy);
        });
    } else {
      this.deleteLevel([], hierarchy);
    }
  }

  private deleteLevel(array: vwEcheloneUsage[], hierarchy: vwHierarchy) {
    let total_usage = _.sumBy(array, a => a.count);
    let modelRef = this.modalService.open(
      DeleteHierarchyLevelComponent,
      this.modalOptions
    );

    let max_level = this.originalFirmHierarchy.length;
    let echelons = this.originalFirmHierarchy.find(
      a => a.level == hierarchy.level
    ).echelons;

    let component = modelRef.componentInstance;
    component.canDelete =
      hierarchy.level < max_level && echelons.length == 0 && total_usage == 0;

    modelRef.result.then(res => {
      if (res) {
        this.hierarchyService
          .v1HierarchyIdDelete({
            id: hierarchy.id
          })
          .pipe(
            map(response => {
              return JSON.parse(response as any).results;
            })
          )
          .subscribe(
            () => {
              this.toaster.showSuccess(
                this.error_data.delete_hierarchy_level_success
              );
              this.getHierarchyData();
            },
            () => {
            }
          );
      }
    });
  }

  public addHierarchyNode(hierarchy: vwHierarchy) {
    let modelRef = this.modalService.open(
      CreateCustomHierarchyNodeComponent,
      this.modalOptions
    );

    let component = modelRef.componentInstance;
    component.firmHierarchy = this.originalFirmHierarchy;
    component.practiceAreaList = this.practiceAreaList;
    component.echelon.hierarchyId = hierarchy.id;
    component.echelon.level = hierarchy.level;
    component.firmDetails = this.firmDetails;

    let selectedParent = 0;

    Object.keys(this.selectedLevelAndId).forEach((level, i) => {
      if (+level == hierarchy.level && i > 0) {
        selectedParent = this.selectedLevelAndId[i - 1];
      }
    });

    component.echelon.parentId =
      hierarchy.level == this.minLevel
        ? this.firmDetails.id
        : selectedParent
        ? selectedParent
        : 0;

    modelRef.result.then((res: vwEchelon) => {
      if (res) {
        res.description = res.name;

        this.echelonService
          .v1EchelonPost$Json({
            body: res
          })
          .pipe(
            map(response => {
              return JSON.parse(response as any).results;
            })
          )
          .subscribe(
            () => {
              this.toaster.showSuccess(this.error_data.add_hierarchy_node_success);
              this.getHierarchyData();
            },
            () => {
            }
          );
      }
    });
  }

  edit(echelon: vwLocalEchelon, hierarchy: vwHierarchy, $event: MouseEvent) {
    $event.stopPropagation();
    let modelRef = this.modalService.open(
      CreateCustomHierarchyNodeComponent,
      this.modalOptions
    );
    let component = modelRef.componentInstance;
    component.firmHierarchy = this.originalFirmHierarchy;
    component.practiceAreaList = this.practiceAreaList;
    component.echelon = { ...echelon };
    component.firmDetails = this.firmDetails;
    modelRef.result.then(res => {
      if (res) {
        component.echelon.parentId =
          hierarchy.level == 1 ? null : component.echelon.parentId;
        this.echelonService
          .v1EchelonPut$Json({
            body: res
          })
          .pipe(
            map(response => {
              return JSON.parse(response as any).results;
            })
          )
          .subscribe(
            () => {
              this.toaster.showSuccess(
                this.error_data.udpate_hierarchy_node_success
              );

              this.getHierarchyData();
            },
            () => {
            }
          );
      }
    });
  }

  remove(echelon: vwLocalEchelon, hierarchy: vwHierarchy, $event: MouseEvent) {
    $event.stopPropagation();
    this.echelonService
      .v1EchelonCheckUsagePost$Json({
        body: [echelon.id]
      })
      .pipe(
        map(response => {
          return JSON.parse(response as any).results as vwEcheloneUsage[];
        }),
        finalize(() => {
        })
      )
      .subscribe(res => {
        let usage = res.find(a => a.echeclonId == echelon.id);
        let modelRef = this.modalService.open(
          DeleteHierarchyNodeComponent,
          this.modalOptions
        );
        let component = modelRef.componentInstance;
        component.canDelete = usage ? usage.count == 0 : false;
        modelRef.result.then(res => {
          if (res) {
            this.echelonService
              .v1EchelonIdDelete({
                id: echelon.id
              })
              .pipe(
                map(response => {
                  return JSON.parse(response as any).results;
                })
              )
              .subscribe(
                () => {
                  this.toaster.showSuccess(
                    this.error_data.delete_hierarchy_node_success
                  );
                  if (
                    this.selectedLevelAndId &&
                    this.selectedLevelAndId[hierarchy.level] == echelon.id
                  ) {
                    Object.keys(this.selectedLevelAndId).forEach(a => {
                      if (+a >= hierarchy.level) {
                        delete this.selectedLevelAndId[a];
                      }
                    });
                  }

                  this.getHierarchyData();
                },
                () => {
                }
              );
          }
        });
      });
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
