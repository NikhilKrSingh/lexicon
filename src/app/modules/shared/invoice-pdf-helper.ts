import * as _ from 'lodash';
import { DatePipe, DecimalPipe } from "@angular/common";
import { vwBillingSettings } from "src/common/swagger-providers/models";
import { vwInvoice } from "../models/vw-invoice";

export class InvoicePDFHelper {
  public static PrepareHTML(
    dp: DatePipe,
    np: DecimalPipe,
    invoiceHTML: string,
    invoiceDetails: vwInvoice,
    matterBillingSettings: vwBillingSettings,
    today: any,
    totalHours: number,
    totalFees: number,
    totalDisbursements: number,
    trustAccountEnabled: boolean,
    trustAccountDetails: any
  ) {
    if (invoiceDetails.initialConsult) {
      return InvoicePDFHelper.createInvoiceForPotentialClient(
        dp,
        np,
        invoiceHTML,
        invoiceDetails,
        totalHours,
        totalFees
      );
    } else {
      return InvoicePDFHelper.createInvoiceForMatter(
        dp,
        np,
        invoiceHTML,
        invoiceDetails,
        matterBillingSettings,
        today,
        totalHours,
        totalFees,
        totalDisbursements,
        trustAccountEnabled,
        trustAccountDetails
      );
    }
  }

  private static createInvoiceForPotentialClient(
    dp: DatePipe,
    np: DecimalPipe,
    invoiceHTML: string,
    invoiceDetails: vwInvoice,
    totalHours: number,
    totalFees: number
  ) {
    let div = document.createElement('div');
    div.innerHTML = invoiceHTML;

    let coverPage = div.querySelector('#cover-page');
    let trustAccountingSection = coverPage.querySelector('#trust-accounting-section');
    let header = div.querySelector('#header-div') as HTMLDivElement;
    let footer = div.querySelector('#footer-div') as HTMLDivElement;
    let hourlyMatterPage = div.querySelector('#page-hourly-matter');

    let matterNumbersTags = div.querySelectorAll('.matter-number');
    Array.from(matterNumbersTags).forEach((m: HTMLDivElement) => {
      m.style.display = 'none';
    });

    let matterNamesTags = div.querySelectorAll('.matter-name');
    Array.from(matterNamesTags).forEach((m: HTMLDivElement) => {
      m.style.display = 'none';
    });

    let disbursementContainer = hourlyMatterPage.querySelector('#disbursement-page-container');
    if (disbursementContainer) {
      disbursementContainer.classList.add('d-none');
    }

    let copyhourlyMatterPage = document.createElement('div');
    copyhourlyMatterPage.id = "page-hourly-matter-1";
    copyhourlyMatterPage.classList.add('card');
    copyhourlyMatterPage.classList.add('box-shadow');
    copyhourlyMatterPage.innerHTML = hourlyMatterPage.innerHTML;

    let fixedFeeMatterPage = div.querySelector('#page-fixed-fee-matter');
    fixedFeeMatterPage.classList.add('d-none');
    fixedFeeMatterPage.classList.remove('d-block');

    let trustAccountingPage = div.querySelector('#page-trust-accounting');

    trustAccountingSection.classList.add('d-none');
    trustAccountingSection.classList.remove('d-block');

    let trustAccountingSectiondiv = trustAccountingSection as HTMLDivElement;
    trustAccountingSectiondiv.style.display = "none";

    trustAccountingPage.classList.add('d-none');
    trustAccountingPage.classList.remove('d-block');

    fixedFeeMatterPage.classList.add('d-none');
    fixedFeeMatterPage.classList.remove('d-block');

    let pageNumber = 2;

    let showConsultationFeePage = false;
    let consultationFeeCount = 0;

    if (invoiceDetails.consultationFees && invoiceDetails.consultationFees.length > 0) {
      showConsultationFeePage = true;
      consultationFeeCount = invoiceDetails.consultationFees.length;
    }

    if (showConsultationFeePage) {
      hourlyMatterPage.classList.add('d-block');
      hourlyMatterPage.classList.remove('d-none');

      fixedFeeMatterPage.classList.add('d-none');
      fixedFeeMatterPage.classList.remove('d-block');

      hourlyMatterPage.innerHTML = hourlyMatterPage.innerHTML.replace(
        '[PageNumber]',
        pageNumber.toString()
      );

      pageNumber = pageNumber + 1;

      //#region [Consultation Fees]
      let consultFeeContainer = hourlyMatterPage.querySelector('.hours-table-container');
      let consultFeeBody = consultFeeContainer.querySelector('.hours-table-body');
      let consultFeeFooter = consultFeeContainer.querySelector('tfoot');
      let consultFeeHeader = consultFeeContainer.querySelector('thead');
      let consultFeeRow = consultFeeBody.querySelector('.hours-table-row');

      consultFeeHeader.innerHTML = consultFeeHeader.innerHTML.replace('Date of Service', 'Initial Consultation Date');
      consultFeeHeader.innerHTML = consultFeeHeader.innerHTML.replace('Timekeeper', 'Consult Attorney Name');
      consultFeeHeader.innerHTML = consultFeeHeader.innerHTML.replace('Hours', 'Consultation Duration');
      consultFeeHeader.innerHTML = consultFeeHeader.innerHTML.replace('Hourly Rate', '&nbsp;');

      consultFeeFooter.innerHTML = consultFeeFooter.innerHTML.replace('>–<', '>&nbsp;<');

      if (totalHours >= 0) {
        consultFeeFooter.innerHTML = consultFeeFooter.innerHTML.replace(
          '[TotalHours]',
          `${np.transform(totalHours, '1.2-2')}`
        );
      } else {
        consultFeeFooter.innerHTML = consultFeeFooter.innerHTML.replace(
          '[TotalHours]',
          `(${np.transform(totalHours * -1, '1.2-2')})`
        );
      }

      if (totalFees >= 0) {
        consultFeeFooter.innerHTML = consultFeeFooter.innerHTML.replace(
          '[TotalDollars]',
          `${np.transform(totalFees, '1.2-2')}`
        );
      } else {
        consultFeeFooter.innerHTML = consultFeeFooter.innerHTML.replace(
          '[TotalDollars]',
          `(${np.transform(totalFees * -1, '1.2-2')})`
        );
      }

      consultFeeBody.innerHTML = '';

      invoiceDetails.consultationFees.forEach(row => {
        let rowHTML = consultFeeRow.innerHTML;

        //#region rowHTML
        rowHTML = rowHTML.replace(
          '[DateService]',
          dp.transform(row.consultationFeeList.dateOfService, 'MM/dd/yyyy')
        );

        rowHTML = rowHTML.replace(
          '[Lastname, Firstname]',
          row.consultationFeeList.enterBy || ''
        );

        rowHTML = rowHTML.replace(
          '[BillingNarrative]',
          row.consultationFeeList.billingNarrative
        );

        row.total_hrs = row.total_hrs || 0;

        if (row.total_hrs > 0 && (row.consultationFeeList.isNegetive || row.consultationFeeList.displayAmount < 0)) {
          row.total_hrs = row.total_hrs * -1;
        }

        if (row.consultationFeeList.isNegetive || row.total_hrs < 0) {
          rowHTML = rowHTML.replace(
            '[Hours]',
            `(${np.transform(row.total_hrs * -1, '1.2-2')})`
          )
        } else {
          rowHTML = rowHTML.replace(
            '[Hours]',
            `${np.transform(row.total_hrs, '1.2-2')}`
          );
        }

        rowHTML = rowHTML.replace(
          '$ [HourlyRate]',
          ``
        );

        let total_amt = row.consultationFeeList.displayAmount;
        if (total_amt >= 0) {
          rowHTML = rowHTML.replace(
            '[HoursXRate]',
            `${np.transform(total_amt, '1.2-2')}`
          );
        } else {
          rowHTML = rowHTML.replace(
            '[HoursXRate]',
            `(${np.transform(total_amt * -1, '1.2-2')})`
          );
        }


        //#endregion rowHTML
        let tr = document.createElement('tr');
        tr.innerHTML = rowHTML;
        consultFeeBody.appendChild(tr);
      });

      //#endregion [Consultation Fees]

      if (consultationFeeCount > 20) {
        copyhourlyMatterPage.innerHTML = copyhourlyMatterPage.innerHTML.replace(
          '[PageNumber]',
          pageNumber.toString()
        );

        pageNumber = pageNumber + 1;

        hourlyMatterPage.insertAdjacentElement('afterend', copyhourlyMatterPage);
        hourlyMatterPage = copyhourlyMatterPage;
      }
    } else {
      hourlyMatterPage.classList.add('d-none');
      hourlyMatterPage.classList.remove('d-block');
    }

    return {
      div,
      coverPage,
      invoiceHeader: {
        nativeElement: header
      },
      invoiceFooter: {
        nativeElement: footer
      }
    };
  }

  private static createInvoiceForMatter(
    dp: DatePipe,
    np: DecimalPipe,
    invoiceHTML: string,
    invoiceDetails: vwInvoice,
    matterBillingSettings: vwBillingSettings,
    today: any,
    totalHours: number,
    totalFees: number,
    totalDisbursements: number,
    trustAccountEnabled: boolean,
    trustAccountDetails: any
  ) {
    let div = document.createElement('div');
    div.innerHTML = invoiceHTML;

    let coverPage = div.querySelector('#cover-page');
    let trustAccountingSection = coverPage.querySelector('#trust-accounting-section');
    let header = div.querySelector('#header-div') as HTMLDivElement;
    let footer = div.querySelector('#footer-div') as HTMLDivElement;
    let hourlyMatterPage = div.querySelector('#page-hourly-matter');

    let copyhourlyMatterPage = document.createElement('div');
    copyhourlyMatterPage.id = "page-hourly-matter-1";
    copyhourlyMatterPage.classList.add('card');
    copyhourlyMatterPage.classList.add('box-shadow');
    copyhourlyMatterPage.innerHTML = hourlyMatterPage.innerHTML;

    let fixedFeeMatterPage = div.querySelector('#page-fixed-fee-matter');

    let copyFixedFeeMatterPage = document.createElement('div');
    copyFixedFeeMatterPage.id = "page-fixed-fee-matter-1";
    copyFixedFeeMatterPage.classList.add('card');
    copyFixedFeeMatterPage.classList.add('box-shadow');
    copyFixedFeeMatterPage.innerHTML = fixedFeeMatterPage.innerHTML;

    let copyfixedFeeContainerPage = copyFixedFeeMatterPage.querySelector('#fixed-fee-page-container');
    if (copyfixedFeeContainerPage) {
      copyfixedFeeContainerPage.classList.add('d-none');
    }

    let trustAccountingPage = div.querySelector('#page-trust-accounting');

    let pageNumber = 2;

    if (invoiceDetails.isFixedFee) {
      hourlyMatterPage.classList.add('d-none');
      hourlyMatterPage.classList.remove('d-block');

      let showFixedFeePage = false;
      let showFixedFeeSection = false;

      if (invoiceDetails.fixedFeeService && invoiceDetails.fixedFeeService.length > 0) {
        showFixedFeePage = true;
        showFixedFeeSection = true;
      }

      if (invoiceDetails.addOnServices && invoiceDetails.addOnServices.length > 0) {
        showFixedFeePage = true;
        showFixedFeeSection = true;
      }

      let disbCount = 0;

      if (invoiceDetails.recordDisbursement && invoiceDetails.recordDisbursement.length > 0) {
        showFixedFeePage = true;
        disbCount = invoiceDetails.recordDisbursement.length;
      }

      if (showFixedFeePage) {
        fixedFeeMatterPage.classList.add('d-block');
        fixedFeeMatterPage.classList.remove('d-none');

        fixedFeeMatterPage.innerHTML = fixedFeeMatterPage.innerHTML.replace(
          '[PageNumber]',
          pageNumber.toString()
        );

        pageNumber = pageNumber + 1;

        if (showFixedFeeSection) {
          let fixedFeeContainer = fixedFeeMatterPage.querySelector('.fixed-fee-table-container');
          let fixedFeeBody = fixedFeeContainer.querySelector('.fixed-fee-body');
          let fixedFeeFooter = fixedFeeContainer.querySelector('tfoot');
          let fixedFeeRow = fixedFeeBody.querySelector('.fixed-fee-row');

          fixedFeeBody.innerHTML = '';

          let dateOfService: any = today;
          let totalAmount = 0;
          let serviceCount = 0;

          if (matterBillingSettings) {
            if (matterBillingSettings.fixedFeeIsFullAmount) {
              dateOfService = invoiceDetails.matterOpenDate;
            } else {
              if (matterBillingSettings.fixedFeeBillOnWorkComplete) {
                dateOfService = invoiceDetails.generated;
              }

              if (matterBillingSettings.fixedFeeDueDate) {
                dateOfService = matterBillingSettings.fixedFeeDueDate;
              }
            }
          }

          invoiceDetails.fixedFeeService.forEach(fixedFee => {
            serviceCount++;

            let rowHTML = fixedFeeRow.innerHTML;
            let amount = fixedFee.rateAmount - (fixedFee.writeDown || 0);

            totalAmount = totalAmount + amount;

            rowHTML = rowHTML.replace(
              '[DateService]',
              `${dp.transform(dateOfService, 'MM/dd/yyyy')}`
            );

            rowHTML = rowHTML.replace(
              '[FixedFeeServiceDescription]',
              `${fixedFee.description}`
            );

            if (amount >= 0) {
              rowHTML = rowHTML.replace(
                '[ServiceAmount]',
                `${np.transform(amount, '1.2-2')}`
              );
            } else {
              rowHTML = rowHTML.replace(
                '[ServiceAmount]',
                `(${np.transform(amount * -1, '1.2-2')})`
              );
            }

            let tr = document.createElement('tr');
            tr.innerHTML = rowHTML;
            fixedFeeBody.appendChild(tr);
          });

          invoiceDetails.addOnServices.forEach(addOn => {
            serviceCount++;

            let rowHTML = fixedFeeRow.innerHTML;
            let amount = addOn.serviceAmount - (addOn.writeDown || 0);

            totalAmount = totalAmount + amount;

            rowHTML = rowHTML.replace(
              '[DateService]',
              `${dp.transform(dateOfService, 'MM/dd/yyyy')}`
            );

            rowHTML = rowHTML.replace(
              '[FixedFeeServiceDescription]',
              `${addOn.serviceName}`
            );

            if (amount >= 0) {
              rowHTML = rowHTML.replace(
                '[ServiceAmount]',
                `${np.transform(amount, '1.2-2')}`
              );
            } else {
              rowHTML = rowHTML.replace(
                '[ServiceAmount]',
                `(${np.transform(amount * -1, '1.2-2')})`
              );
            }

            let tr = document.createElement('tr');
            tr.innerHTML = rowHTML;
            fixedFeeBody.appendChild(tr);
          });

          fixedFeeFooter.innerHTML = fixedFeeFooter.innerHTML.replace(
            '[Total]',
            `${serviceCount}`
          );

          if (totalAmount >= 0) {
            fixedFeeFooter.innerHTML = fixedFeeFooter.innerHTML.replace(
              '[TotalDollars]',
              `${np.transform(totalAmount, '1.2-2')}`
            );
          } else {
            fixedFeeFooter.innerHTML = fixedFeeFooter.innerHTML.replace(
              '[TotalDollars]',
              `(${np.transform(totalAmount * -1, '1.2-2')})`
            );
          }

          if ((serviceCount + disbCount) > 25) {
            let disbursementContainer = fixedFeeMatterPage.querySelector('#disbursement-page-container');
            if (disbursementContainer) {
              disbursementContainer.classList.add('d-none');
            }

            copyFixedFeeMatterPage.innerHTML = copyFixedFeeMatterPage.innerHTML.replace(
              '[PageNumber]',
              pageNumber.toString()
            );

            pageNumber = pageNumber + 1;

            fixedFeeMatterPage.insertAdjacentElement('afterend', copyFixedFeeMatterPage);
            fixedFeeMatterPage = copyFixedFeeMatterPage;
          }
        } else {
          let fixedFeeContainerPage = fixedFeeMatterPage.querySelector('#fixed-fee-page-container');
          if (fixedFeeContainerPage) {
            fixedFeeContainerPage.classList.add('d-none');
          }
        }
      } else {
        fixedFeeMatterPage.classList.add('d-none');
        fixedFeeMatterPage.classList.remove('d-block');
      }
    } else {
      fixedFeeMatterPage.classList.add('d-none');
      fixedFeeMatterPage.classList.remove('d-block');

      let showTimeEntryPage = false;
      let showTimekeepingSection = false;

      let timeEntryCount = 0;
      let disbCount = 0;

      if (invoiceDetails.timeEntries && invoiceDetails.timeEntries.length > 0) {
        showTimeEntryPage = true;
        showTimekeepingSection = true;
        timeEntryCount = invoiceDetails.timeEntries.length;
      }

      if (invoiceDetails.recordDisbursement && invoiceDetails.recordDisbursement.length > 0) {
        showTimeEntryPage = true;
        disbCount = invoiceDetails.recordDisbursement.length;
      }

      if (showTimeEntryPage) {
        hourlyMatterPage.classList.add('d-block');
        hourlyMatterPage.classList.remove('d-none');

        fixedFeeMatterPage.classList.add('d-none');
        fixedFeeMatterPage.classList.remove('d-block');

        hourlyMatterPage.innerHTML = hourlyMatterPage.innerHTML.replace(
          '[PageNumber]',
          pageNumber.toString()
        );

        pageNumber = pageNumber + 1;

        if (showTimekeepingSection) {
          //#region [Time Entries]
          let timeEntryContainer = hourlyMatterPage.querySelector('.hours-table-container');
          let timeEntriesBody = timeEntryContainer.querySelector('.hours-table-body');
          let timeEntriesFooter = timeEntryContainer.querySelector('tfoot');
          let timeEntryRow = timeEntriesBody.querySelector('.hours-table-row');

          if (totalHours >= 0) {
            timeEntriesFooter.innerHTML = timeEntriesFooter.innerHTML.replace(
              '[TotalHours]',
              `${np.transform(totalHours, '1.2-2')}`
            );
          } else {
            timeEntriesFooter.innerHTML = timeEntriesFooter.innerHTML.replace(
              '[TotalHours]',
              `(${np.transform(totalHours * -1, '1.2-2')})`
            );
          }

          if (totalFees >= 0) {
            timeEntriesFooter.innerHTML = timeEntriesFooter.innerHTML.replace(
              '[TotalDollars]',
              `${np.transform(totalFees, '1.2-2')}`
            );
          } else {
            timeEntriesFooter.innerHTML = timeEntriesFooter.innerHTML.replace(
              '[TotalDollars]',
              `(${np.transform(totalFees * -1, '1.2-2')})`
            );
          }

          timeEntriesBody.innerHTML = '';

          invoiceDetails.timeEntries.forEach(row => {
            let rowHTML = timeEntryRow.innerHTML;

            //#region rowHTML
            rowHTML = rowHTML.replace(
              '[DateService]',
              dp.transform(row.date, 'MM/dd/yyyy')
            );

            rowHTML = rowHTML.replace(
              '[Lastname, Firstname]',
              row.person ? row.person.name : ''
            );

            rowHTML = rowHTML.replace(
              '[BillingNarrative]',
              row.description
            );

            if (row.hoursBilled != undefined || row.hoursBilled != null) {
              row.hoursBilled = row.hoursBilled || 0;
              if (row.hoursBilled >= 0) {
                rowHTML = rowHTML.replace(
                  '[Hours]',
                  `${np.transform(row.hoursBilled, '1.2-2')}`
                );
              } else {
                rowHTML = rowHTML.replace(
                  '[Hours]',
                  `(${np.transform(row.hoursBilled * -1, '1.2-2')})`
                );
              }

              let hourlyrate = 0;
              if (row.hoursBilled > 0) {
                row.amount / row.hoursBilled;
              }

              if (hourlyrate < 0) {
                hourlyrate = hourlyrate * -1;
              }

              rowHTML = rowHTML.replace(
                '[HourlyRate]',
                `${np.transform(hourlyrate, '1.2-2')}`
              );

              let total_amt = row.amount - row.writeDownAmount;
              if (total_amt >= 0) {
                rowHTML = rowHTML.replace(
                  '[HoursXRate]',
                  `${np.transform(total_amt, '1.2-2')}`
                );
              } else {
                rowHTML = rowHTML.replace(
                  '[HoursXRate]',
                  `(${np.transform(total_amt * -1, '1.2-2')})`
                );
              }
            } else {
              let totalHours = 0;
              if (row.hours && row.hours.value && row.hours.value.totalHours) {
                totalHours = row.hours.value.totalHours;
              }

              if (!row.isNegative) {
                rowHTML = rowHTML.replace(
                  '[Hours]',
                  `${np.transform(totalHours, '1.2-2')}`
                );
              } else {
                rowHTML = rowHTML.replace(
                  '[Hours]',
                  `(${np.transform(totalHours, '1.2-2')})`
                );
              }

              rowHTML = rowHTML.replace(
                '[HourlyRate]',
                `${np.transform(row.disbursementType.rate, '1.2-2')}`
              );

              let total_amt = row.disbursementType.rate * totalHours;

              if (row.isNegative) {
                total_amt = (total_amt * -1) - row.writeDownAmount;

                if (total_amt < 0) {
                  total_amt = total_amt * -1;
                }

                rowHTML = rowHTML.replace(
                  '[HoursXRate]',
                  `(${np.transform(total_amt, '1.2-2')})`
                );
              } else {
                total_amt = total_amt - row.writeDownAmount;

                rowHTML = rowHTML.replace(
                  '[HoursXRate]',
                  `${np.transform(total_amt, '1.2-2')}`
                );
              }
            }

            //#endregion rowHTML
            let tr = document.createElement('tr');
            tr.innerHTML = rowHTML;
            timeEntriesBody.appendChild(tr);
          });

          //#endregion [Time Entries]
        } else {
          let timekeepingsection = hourlyMatterPage.querySelector('#hourly-page-container');
          if (timekeepingsection) {
            timekeepingsection.classList.add('d-none');
          }
        }

        if ((timeEntryCount + disbCount) > 20) {
          if (timeEntryCount > 15) {
            let disbursementContainer = hourlyMatterPage.querySelector('#disbursement-page-container');
            if (disbursementContainer) {
              disbursementContainer.classList.add('d-none');
            }
          }

          copyhourlyMatterPage.innerHTML = copyhourlyMatterPage.innerHTML.replace(
            '[PageNumber]',
            pageNumber.toString()
          );

          pageNumber = pageNumber + 1;

          hourlyMatterPage.insertAdjacentElement('afterend', copyhourlyMatterPage);
          hourlyMatterPage = copyhourlyMatterPage;
        }
      } else {
        hourlyMatterPage.classList.add('d-none');
        hourlyMatterPage.classList.remove('d-block');
      }
    }

    //#region [Disbursements]
    if (invoiceDetails.recordDisbursement && invoiceDetails.recordDisbursement.length > 0) {
      let disbursementContainer = hourlyMatterPage.querySelector('.dis-table-container');
      if (invoiceDetails.isFixedFee) {
        disbursementContainer = fixedFeeMatterPage.querySelector('.dis-table-container');
      }

      let disbursementBody = disbursementContainer.querySelector('.dis-table-body');
      let disbursementTotal = disbursementContainer.querySelector('tfoot');

      let totalQuantity = 0;

      let disbursementRow = disbursementBody.querySelector('.dis-table-row');

      disbursementBody.innerHTML = '';

      invoiceDetails.recordDisbursement.forEach(disbursement => {
        let rowHTML = disbursementRow.innerHTML;

        rowHTML = rowHTML.replace(
          '[DateService]',
          `${dp.transform(disbursement.date, 'MM/dd/yyyy')}`
        );

        let amt = (disbursement.amount - (disbursement.writeDownAmount || 0));

        if (amt >= 0) {
          rowHTML = rowHTML.replace(
            '[QuantityXRPU]',
            `${np.transform(amt, '1.2-2')}`
          );
        } else {
          rowHTML = rowHTML.replace(
            '[QuantityXRPU]',
            `(${np.transform(amt * -1, '1.2-2')})`
          );
        }

        if (disbursement.disbursementType.rate > 0) {
          rowHTML = rowHTML.replace(
            '[FixedorAmount]',
            `${np.transform(disbursement.disbursementType.rate, '1.2-2')}`
          );

          let hours = 1;
          if (disbursement.hoursBilled > 0 || disbursement.hoursBilled < 0) {
            hours = disbursement.hoursBilled;
          }

          if (disbursement.amount < 0 && hours > 0) {
            hours = hours * -1;
          }

          if (hours >= 0) {
            rowHTML = rowHTML.replace(
              '[Quantity]',
              `${hours}`
            );
          } else {
            rowHTML = rowHTML.replace(
              '[Quantity]',
              `(${hours * -1})`
            );
          }

          totalQuantity = totalQuantity + hours;
        } else {
          totalQuantity = totalQuantity + 1;
          rowHTML = rowHTML.replace(
            '[Quantity]',
            `1`
          );

          if (disbursement.amount >= 0) {
            rowHTML = rowHTML.replace(
              '[FixedorAmount]',
              `${np.transform(disbursement.amount, '1.2-2')}`
            );
          } else {
            rowHTML = rowHTML.replace(
              '[FixedorAmount]',
              `(${np.transform(disbursement.amount * -1, '1.2-2')})`
            );
          }
        }

        let billingNarrative = disbursement.description;
        if (!billingNarrative) {
          if (disbursement.note && disbursement.note.content) {
            billingNarrative = disbursement.note.content || '';
          } else {
            billingNarrative = '';
          }
        }

        rowHTML = rowHTML.replace(
          '[BillingNarrative]',
          `${billingNarrative}`
        );

        let tr = document.createElement('tr');
        tr.innerHTML = rowHTML;

        disbursementBody.appendChild(tr);
      });

      if (totalQuantity >= 0) {
        disbursementTotal.innerHTML = disbursementTotal.innerHTML.replace(
          '[TotalQuantity]',
          `${totalQuantity}`
        );
      } else {
        disbursementTotal.innerHTML = disbursementTotal.innerHTML.replace(
          '[TotalQuantity]',
          `(${totalQuantity * -1})`
        );
      }

      if (totalDisbursements >= 0) {
        disbursementTotal.innerHTML = disbursementTotal.innerHTML.replace(
          '[TotalDollars]',
          `${np.transform(totalDisbursements, '1.2-2')}`
        );
      } else {
        disbursementTotal.innerHTML = disbursementTotal.innerHTML.replace(
          '[TotalDollars]',
          `(${np.transform(totalDisbursements * -1, '1.2-2')})`
        );
      }
    } else {
      let disPage = hourlyMatterPage.querySelector('#disbursement-page-container');
      if (disPage) {
        disPage.classList.add('d-none');
      }

      disPage = fixedFeeMatterPage.querySelector('#disbursement-page-container');
      if (disPage) {
        disPage.classList.add('d-none');
      }
    }

    //#endregion [Disbursements]

    if (trustAccountEnabled) {
      trustAccountingSection.classList.add('d-block');
      trustAccountingPage.classList.add('d-block');

      trustAccountingPage.innerHTML = trustAccountingPage.innerHTML.replace(
        '[PageNumber]',
        pageNumber.toString()
      );

      if (invoiceDetails.primaryRetainerTrust) {
        trustAccountingSection.innerHTML = trustAccountingSection.innerHTML.replace(
          '[PrimaryRetainerTrustBalance]',
          np.transform(invoiceDetails.primaryRetainerTrust.currentBalance, '1.2-2')
        );
      } else {
        trustAccountingSection.innerHTML = trustAccountingSection.innerHTML.replace(
          '[PrimaryRetainerTrustBalance]',
          np.transform(0, '1.2-2')
        );
      }

      if (invoiceDetails.trustAccounts && invoiceDetails.trustAccounts.length > 0) {
        let totalTrust = _.sumBy(invoiceDetails.trustAccounts, a => a.currentBalance || 0);
        trustAccountingSection.innerHTML = trustAccountingSection.innerHTML.replace(
          '[TotalTrustOnHand]',
          np.transform(totalTrust, '1.2-2')
        );
      } else {
        trustAccountingSection.innerHTML = trustAccountingSection.innerHTML.replace(
          '[TotalTrustOnHand]',
          np.transform(0, '1.2-2')
        );
      }

      trustAccountingSection.innerHTML = trustAccountingSection.innerHTML.replace(
        '[TotalMoniesOnHand]',
        np.transform(trustAccountDetails.totalAmount, '1.2-2')
      );

      let primaryTrustBalance = trustAccountingPage.querySelector('#primary-retainer-trust-balance');
      if (primaryTrustBalance) {
        if (!invoiceDetails.primaryRetainerTrustSummary) {
          invoiceDetails.primaryRetainerTrustSummary = {
            startingBalance: 0,
            credits: 0,
            debits: 0,
            endingBalance: 0
          };
        };

        primaryTrustBalance.innerHTML = primaryTrustBalance.innerHTML.replace(
          '[BeginningBalance]',
          np.transform(invoiceDetails.primaryRetainerTrustSummary.startingBalance, '1.2-2')
        );

        primaryTrustBalance.innerHTML = primaryTrustBalance.innerHTML.replace(
          '[Additions]',
          np.transform(invoiceDetails.primaryRetainerTrustSummary.credits || 0, '1.2-2')
        );

        primaryTrustBalance.innerHTML = primaryTrustBalance.innerHTML.replace(
          '[Withdrawals]',
          np.transform(invoiceDetails.primaryRetainerTrustSummary.debits || 0, '1.2-2')
        );

        primaryTrustBalance.innerHTML = primaryTrustBalance.innerHTML.replace(
          '[EndingBalance]',
          np.transform(invoiceDetails.primaryRetainerTrustSummary.endingBalance || 0, '1.2-2')
        );
      }

      let trustOnlyBalance = trustAccountingPage.querySelector('#trust-only-balance');
      if (trustOnlyBalance) {
        if (!invoiceDetails.trustOnlyAccountsSummary) {
          invoiceDetails.trustOnlyAccountsSummary = {
            startingBalance: 0,
            credits: 0,
            debits: 0,
            endingBalance: 0
          };
        };

        trustOnlyBalance.innerHTML = trustOnlyBalance.innerHTML.replace(
          '[BeginningBalance]',
          np.transform(invoiceDetails.trustOnlyAccountsSummary.startingBalance || 0, '1.2-2')
        );

        trustOnlyBalance.innerHTML = trustOnlyBalance.innerHTML.replace(
          '[Additions]',
          np.transform(invoiceDetails.trustOnlyAccountsSummary.credits || 0, '1.2-2')
        );

        trustOnlyBalance.innerHTML = trustOnlyBalance.innerHTML.replace(
          '[Withdrawals]',
          np.transform(invoiceDetails.trustOnlyAccountsSummary.debits || 0, '1.2-2')
        );

        trustOnlyBalance.innerHTML = trustOnlyBalance.innerHTML.replace(
          '[EndingBalance]',
          np.transform(invoiceDetails.trustOnlyAccountsSummary.endingBalance || 0, '1.2-2')
        );
      }


    } else {
      trustAccountingSection.classList.add('d-none');
      trustAccountingSection.classList.remove('d-block');

      let trustAccountingSectiondiv = trustAccountingSection as HTMLDivElement;
      trustAccountingSectiondiv.style.display = "none";

      trustAccountingPage.classList.add('d-none');
      trustAccountingPage.classList.remove('d-block');
    }

    return {
      div,
      coverPage,
      invoiceHeader: {
        nativeElement: header
      },
      invoiceFooter: {
        nativeElement: footer
      }
    };
  }
}
