import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Injectable } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { ToastrModule } from 'ngx-toastr';
import { of } from 'rxjs';
import { AppConfigService, IAppSettings } from 'src/app/app-config.service';
import { CommonInvoicePdfComponent } from 'src/app/modules/shared/invoice-pdf/invoice-pdf.component';
import { reducers } from 'src/app/store';
import { ApiModule } from 'src/common/swagger-providers/api.module';
import {
  BillingService,
  TenantService,
  TrustAccountService,
} from 'src/common/swagger-providers/services';
import { SharedModule } from '../shared.module';
import { By } from '@angular/platform-browser';
import { UtilsHelper } from '../utils.helper';

let store = {};
  const mockLocalStorage = {
    getItem: (key: string): string => {
      return null;
    },
    setItem: (key: string, value: string) => {
      store[key] = `${value}`;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };

const mockInvoice = {
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiI3MTUyIiwiYWN0b3J0IjoiU2FjaGluIiwiYW1yIjoiTWhldHJlIiwiYXVkIjoiRW1wbG95ZWVARXZlcnlvbmVAYWRtaW5AQ29weSAtIDA3IG9jdC12a2phZ2F0IiwiYXpwIjoiMTAwNiIsImVtYWlsIjoic2FjaGlubUB5b3BtYWlsLmNvbSIsImZhbWlseV9uYW1lIjoiQWRtaW4iLCJnZW5kZXIiOiIiLCJUaWVyIjoiQXNjZW5kaW5nIiwiQ29ubmVjdGlvblN0cmluZyI6IkdWSnVQQk1kc0RhRzU1dXRwN005SmwxNzBWY2d3MHlvdFNhY0FEWW4vbG5LV0c2UHNEaHo4dno5N0ZQWnBscUJEWTZGUHY3MnlrY1oyNW1mbXMxdndHd05MRGtXcTBPYW52STB4U3RWd2NtUDh3eUY2MnZNZEptTjlkVHk5eTgrUTJTUFZpOVBNNjd4cG9zdmJHZUtyYVg4dE1Fc1JyOTBaLzBLemxmUjBiTT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiR1ZKdVBCTWRzRGFHNTV1dHA3TTlKbDE3MFZjZ3cweW90U2FjQURZbi9sbktXRzZQc0Roejh2ejk3RlBacGxxQkRZNkZQdjcyeWtjWjI1bWZtczF2d0d3TkxEa1dxME9hbnZJMHhTdFZ3Y21QOHd5RjYydk1kSm1OOWRUeTl5OCtRMlNQVmk5UE02N3hwb3N2YkdlS3JhWDh0TUVzUnI5MFovMEt6bGZSMGJNPSIsIm5iZiI6MTYxMDY4NTM3NiwiZXhwIjoxNjEwNzI4NTc2LCJpYXQiOjE2MTA2ODUzNzZ9.cho_yp3_h_VtYmKMnW773wzo1GjpCJmjDm70aaEE-c4',
  results: {
    id: 1434,
    tenantId: null,
    preBillId: 2193,
    initialConsult: true,
    initialConsultId: null,
    billedDate: '0001-01-01T00:00:00',
    generated: '2021-01-14T11:47:54.15',
    sentByPersonId: null,
    sent: null,
    due: '2021-01-24T11:36:30.797',
    invoicePreference: { id: 23, name: 'Electronic Only' },
    totalInvoiced: -100.0,
    totalPaid: 0.0,
    statusId: { id: 151, name: 'Not Sent' },
    invoiceStatusId: null,
    printStatusId: { id: 154, name: 'Not Printed' },
    printStatusMessage: null,
    emailStatusMessage: null,
    matter: { id: 0, name: 'Consultation Fee', matterNumber: null },
    matterOpenDate: null,
    client: { id: 9605, name: 'PC Invoice 2', uniqueNumber: 5901 },
    recordDisbursement: [],
    timeEntries: [],
    tenantProfile: {
      id: 7,
      tenantId: 1006,
      tenantName: 'Flash 1.0',
      esign: null,
      internalLogo: null,
      faviconicon: null,
      timeRoundInterval: null,
      timeDisplayFormat: null,
      changeStatusNotes: null,
      tier: { tierLevel: 2, tierName: 'Ascending' },
      logo: null,
      favicon: null,
    },
    clientAddress: [
      {
        id: 16964,
        personId: 9605,
        addressTypeId: 1,
        addressTypeName: 'primary',
        name: null,
        address1: '1234 Street',
        address2: null,
        city: 'Adger',
        state: 'AL',
        zipCode: '35006',
        lat: null,
        lon: null,
        image: null,
        googlePlaceId: null,
      },
    ],
    lastInvoices: [
      {
        id: 1434,
        tenantId: null,
        preBillId: null,
        initialConsult: null,
        initialConsultId: null,
        billedDate: '0001-01-01T00:00:00',
        generated: '2021-01-14T11:47:54.15',
        sentByPersonId: null,
        sent: null,
        due: '2021-01-24T11:36:30.797',
        invoicePreference: null,
        totalInvoiced: -100.0,
        totalPaid: 0.0,
        statusId: null,
        invoiceStatusId: null,
        printStatusId: null,
        printStatusMessage: null,
        emailStatusMessage: null,
        matter: null,
        matterOpenDate: null,
        client: null,
        recordDisbursement: [],
        timeEntries: [],
        tenantProfile: null,
        clientAddress: null,
        lastInvoices: null,
        officeDetails: null,
        consultations: null,
        consultationFees: [],
        isFixedFee: null,
        mailed: null,
        outSourced: null,
        fixedFeeService: [],
        addOnServices: [],
        writeOffList: [],
        paymentAndOtherCredits: [],
        primaryRetainerTrust: null,
        trustAccounts: [],
        primaryRetainerTrustSummary: null,
        trustOnlyAccountsSummary: null,
        lastTransactionDate: '0001-01-01T00:00:00',
        billingAttorney: null,
        responsibleAttorney: null,
        isCompany: false,
        emailInfo: null,
        downloadsCount: 0,
        invoiceFileId: 0,
        startingBalance: null,
        endingBalance: null,
        payments: null,
        isLegacyTemplate: null,
      },
      {
        id: 1433,
        tenantId: null,
        preBillId: null,
        initialConsult: null,
        initialConsultId: null,
        billedDate: '0001-01-01T00:00:00',
        generated: '2021-01-14T11:37:14.517',
        sentByPersonId: null,
        sent: null,
        due: '2021-01-24T11:36:30.797',
        invoicePreference: null,
        totalInvoiced: 150.0,
        totalPaid: 33.0,
        statusId: null,
        invoiceStatusId: null,
        printStatusId: null,
        printStatusMessage: null,
        emailStatusMessage: null,
        matter: null,
        matterOpenDate: null,
        client: null,
        recordDisbursement: [],
        timeEntries: [],
        tenantProfile: null,
        clientAddress: null,
        lastInvoices: null,
        officeDetails: null,
        consultations: null,
        consultationFees: [],
        isFixedFee: null,
        mailed: null,
        outSourced: null,
        fixedFeeService: [],
        addOnServices: [],
        writeOffList: [],
        paymentAndOtherCredits: [],
        primaryRetainerTrust: null,
        trustAccounts: [],
        primaryRetainerTrustSummary: null,
        trustOnlyAccountsSummary: null,
        lastTransactionDate: '0001-01-01T00:00:00',
        billingAttorney: null,
        responsibleAttorney: null,
        isCompany: false,
        emailInfo: null,
        downloadsCount: 0,
        invoiceFileId: 0,
        startingBalance: null,
        endingBalance: null,
        payments: null,
        isLegacyTemplate: null,
      },
    ],
    officeDetails: null,
    consultations: [],
    consultationFees: [
      {
        consultationFeeList: {
          dateOfService: '2021-01-14T00:00:00',
          code: '14001',
          name: 'Hourly-Consultation',
          status: 'Billed',
          originalAmount: -220.0,
          displayAmount: -220.0,
          timeEntered: '2021-01-14T11:40:35.517',
          enterBy: 'Mhetre, Sachin',
          note: '22',
          writeDownAmount: 0.0,
          id: 21,
          totalHours: 2,
          totalMins: 0,
          billingNarrative: '22',
          rate: 110.0,
          billType: 'Hourly',
          isNegetive: true,
          consultationFeeCodeId: 3,
        },
        writeDownDetailList: [],
      },
      {
        consultationFeeList: {
          dateOfService: '2021-01-14T00:00:00',
          code: '13001',
          name: 'Code-13001',
          status: 'Billed',
          originalAmount: 120.0,
          displayAmount: 120.0,
          timeEntered: '2021-01-14T11:41:05.527',
          enterBy: 'Mhetre, Sachin',
          note:
            "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
          writeDownAmount: 0.0,
          id: 22,
          totalHours: 3,
          totalMins: 0,
          billingNarrative:
            "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
          rate: 120.0,
          billType: 'Fixed',
          isNegetive: false,
          consultationFeeCodeId: 4,
        },
        writeDownDetailList: [],
      },
    ],
    isFixedFee: false,
    mailed: null,
    outSourced: null,
    fixedFeeService: [],
    addOnServices: [],
    writeOffList: [],
    paymentAndOtherCredits: [],
    primaryRetainerTrust: {
      id: 0,
      name: 'Primary Retainer Trust',
      currentBalance: 0.0,
    },
    trustAccounts: [],
    primaryRetainerTrustSummary: {
      startingBalance: 0.0,
      endingBalance: 0.0,
      credits: 0.0,
      debits: 0.0,
    },
    trustOnlyAccountsSummary: null,
    lastTransactionDate: '2021-01-14T11:38:49.753',
    billingAttorney: null,
    responsibleAttorney: null,
    isCompany: false,
    emailInfo: null,
    downloadsCount: 0,
    invoiceFileId: 0,
    startingBalance: 150.0,
    endingBalance: 17.0,
    payments: 33.0,
    isLegacyTemplate: null,
  },
};

const mockTenantSettings = {
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiI3MTUyIiwiYWN0b3J0IjoiU2FjaGluIiwiYW1yIjoiTWhldHJlIiwiYXVkIjoiRW1wbG95ZWVARXZlcnlvbmVAYWRtaW5AQ29weSAtIDA3IG9jdC12a2phZ2F0IiwiYXpwIjoiMTAwNiIsImVtYWlsIjoic2FjaGlubUB5b3BtYWlsLmNvbSIsImZhbWlseV9uYW1lIjoiQWRtaW4iLCJnZW5kZXIiOiIiLCJUaWVyIjoiQXNjZW5kaW5nIiwiQ29ubmVjdGlvblN0cmluZyI6IkdWSnVQQk1kc0RhRzU1dXRwN005SmwxNzBWY2d3MHlvdFNhY0FEWW4vbG5LV0c2UHNEaHo4dno5N0ZQWnBscUJEWTZGUHY3MnlrY1oyNW1mbXMxdndHd05MRGtXcTBPYW52STB4U3RWd2NtUDh3eUY2MnZNZEptTjlkVHk5eTgrUTJTUFZpOVBNNjd4cG9zdmJHZUtyYVg4dE1Fc1JyOTBaLzBLemxmUjBiTT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiR1ZKdVBCTWRzRGFHNTV1dHA3TTlKbDE3MFZjZ3cweW90U2FjQURZbi9sbktXRzZQc0Roejh2ejk3RlBacGxxQkRZNkZQdjcyeWtjWjI1bWZtczF2d0d3TkxEa1dxME9hbnZJMHhTdFZ3Y21QOHd5RjYydk1kSm1OOWRUeTl5OCtRMlNQVmk5UE02N3hwb3N2YkdlS3JhWDh0TUVzUnI5MFovMEt6bGZSMGJNPSIsIm5iZiI6MTYxMDcwNDA5MywiZXhwIjoxNjEwNzQ3MjkzLCJpYXQiOjE2MTA3MDQwOTN9.t-MajJN7t0v-BP5nj-1mLwsdSaTl-ldsZKLSFUJTxdo',
  results: [
    {
      id: 59,
      office: null,
      person: null,
      matter: null,
      tenant: { id: 1006, name: 'Flash 1.0' },
      billFrequencyQuantity: 1,
      billFrequencyDuration: {
        id: 21,
        code: 'MONTHS',
        name: 'Months',
        email: null,
        primaryPhone: null,
        uniqueNumber: 0,
        cellPhone: null,
      },
      billFrequencyDay: 6,
      billFrequencyRecursOn: 1,
      isInherited: null,
      isWorkComplete: null,
      billFrequencyStartingDate: '2020-12-05T00:00:00',
      billFrequencyNextDate: '2021-01-02T00:00:00',
      effectiveBillFrequencyQuantity: null,
      effectiveBillFrequencyDuration: null,
      effectiveBillFrequencyDay: null,
      effectiveBillFrequencyRecursOn: null,
      effectiveIsInherited: null,
      effectiveBillFrequencyStartingDate: null,
      effectiveBillFrequencyNextDate: '2021-01-23T00:00:00',
      repeatType: 1,
      billWhenHoliday: 3,
      effectiveRepeatType: null,
      effectiveMonthlyRecursOn: null,
      effectiveBillWhenHoliday: null,
      daysToPayInvoices: 10,
      timeEntryGracePeriod: 0,
      timeEntryGracePeriodAt: '2021-01-15T00:00:00+00:00',
      timeRoundingInterval: 7,
      timeDisplayFormat: 1,
      invoiceDelivery: {
        id: 23,
        code: 'ELECTRONIC',
        name: 'Electronic Only',
        email: null,
        primaryPhone: null,
        uniqueNumber: 0,
        cellPhone: null,
      },
      isFixedAmount: null,
      fixedAmount: null,
      minimumTrustBalance: null,
      paymentPlans: true,
      fixedFeeIsFullAmount: null,
      fixedFeeAmountToPay: null,
      fixedFeeRemainingAmount: null,
      fixedFeeDueDate: null,
      fixedFeeBillOnWorkComplete: null,
      invoiceAddressId: null,
      invoiceTemplateId: 24,
      receiptTemplateId: 6,
      operatingRoutingNumber: '122105155',
      operatingAccountNumber: '231453645676',
      changeNotes: '1 week',
      needToUpdateChildRecords: false,
    },
  ],
};

const mockInvoiceTemplate = {
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiI3MTUyIiwiYWN0b3J0IjoiU2FjaGluIiwiYW1yIjoiTWhldHJlIiwiYXVkIjoiRW1wbG95ZWVARXZlcnlvbmVAYWRtaW5AQ29weSAtIDA3IG9jdC12a2phZ2F0IiwiYXpwIjoiMTAwNiIsImVtYWlsIjoic2FjaGlubUB5b3BtYWlsLmNvbSIsImZhbWlseV9uYW1lIjoiQWRtaW4iLCJnZW5kZXIiOiIiLCJUaWVyIjoiQXNjZW5kaW5nIiwiQ29ubmVjdGlvblN0cmluZyI6IkdWSnVQQk1kc0RhRzU1dXRwN005SmwxNzBWY2d3MHlvdFNhY0FEWW4vbG5LV0c2UHNEaHo4dno5N0ZQWnBscUJEWTZGUHY3MnlrY1oyNW1mbXMxdndHd05MRGtXcTBPYW52STB4U3RWd2NtUDh3eUY2MnZNZEptTjlkVHk5eTgrUTJTUFZpOVBNNjd4cG9zdmJHZUtyYVg4dE1Fc1JyOTBaLzBLemxmUjBiTT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiR1ZKdVBCTWRzRGFHNTV1dHA3TTlKbDE3MFZjZ3cweW90U2FjQURZbi9sbktXRzZQc0Roejh2ejk3RlBacGxxQkRZNkZQdjcyeWtjWjI1bWZtczF2d0d3TkxEa1dxME9hbnZJMHhTdFZ3Y21QOHd5RjYydk1kSm1OOWRUeTl5OCtRMlNQVmk5UE02N3hwb3N2YkdlS3JhWDh0TUVzUnI5MFovMEt6bGZSMGJNPSIsIm5iZiI6MTYxMDcwNDA5MywiZXhwIjoxNjEwNzQ3MjkzLCJpYXQiOjE2MTA3MDQwOTN9.t-MajJN7t0v-BP5nj-1mLwsdSaTl-ldsZKLSFUJTxdo',
  results: {
    id: 24,
    templateName: 'Default Invoice Template',
    templateContent:
      '<!DOCTYPE html>\r\n  <html lang="en">\r\n\r\n  <head>\r\n    <meta charset="UTF-8">\r\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\r\n    <title>Invoice</title>\r\n\r\n    <style>\r\n      @page {\r\n        margin: 0cm 0cm;\r\n      }\r\n\r\n      body {\r\n        margin: 0;\r\n      }\r\n\r\n      *,\r\n      *:before,\r\n      *:after{\r\n        box-sizing: border-box;\r\n        -webkit-box-sizing: border-box;\r\n      }\r\n\r\n      /* Define the header rules */\r\n      header {\r\n        /* position: fixed;\r\n          top: 0cm;\r\n          left: 0cm;\r\n          right: 0cm;\r\n          height: 3cm; */\r\n          padding: 0 0 10px;\r\n        border-bottom: 1px solid #353B4B;\r\n      }\r\n\r\n      /* Define the footer rules */\r\n      footer {\r\n        position: absolute;\r\n        bottom: 24px;\r\n        left: 0;\r\n        width: 100%;\r\n        padding: 0;\r\n      }\r\n\r\n      .footer-inner {\r\n        padding: 17px 9px 0;\r\n        border-top: 1px solid #353B4B;\r\n      }\r\n\r\n      .text-right {\r\n        text-align: right !important;\r\n      }\r\n\r\n      .clearfix:after,\r\n      .clearfix:before {\r\n        content: "";\r\n        clear: both;\r\n        display: table;\r\n      }\r\n      .hours-table th,\r\n      .hours-table td {\r\n        padding: 4px 10px;\r\n        vertical-align: top;\r\n        font-size: 8px;\r\n        line-height: 11px;\r\n      }\r\n      .hours-table th {\r\n        border-bottom: 1px solid #353B4B;\r\n        padding-bottom: 2px;\r\n        padding-top: 0;\r\n        line-height: 12px;\r\n      }\r\n      .hours-table tr:nth-child(even) {\r\n        background-color: #F4F7F9;\r\n      }\r\n\r\n      .hours-table tfoot {\r\n        background-color: #494949;\r\n        color: #fff;\r\n      }\r\n\r\n      .pull-left {\r\n        float: left;\r\n      }\r\n\r\n      .pull-right {\r\n        float: right;\r\n      }\r\n\r\n      .dos-left {\r\n        width: 100px;\r\n        text-align: left;\r\n      }\r\n\r\n      .tkpr-td {\r\n        padding-left: 20px;\r\n      }\r\n\r\n      .dos-td {\r\n        width: 350px;\r\n      }\r\n\r\n      .hr-td {\r\n        min-width: 70px;\r\n      }\r\n\r\n      .hrrt-td {\r\n        min-width: 100px;\r\n      }\r\n\r\n      .sbtl-td {\r\n        min-width: 100px;\r\n      }\r\n\r\n      .dis-table {\r\n        display: table;\r\n      }\r\n\r\n      .dis-table>div {\r\n        display: table-cell;\r\n      }\r\n\r\n      .wrapper .card {\r\n        margin-bottom: 24px;\r\n        border-radius: 0;\r\n        position: relative;\r\n      }\r\n\r\n      .box-shadow {\r\n        box-shadow: 0 0 10px rgba(0, 0, 0, 0.3) !important;\r\n      }\r\n\r\n      .wrapper .card .card-body {\r\n        height: 1000px;\r\n        position: relative;\r\n        padding: 32px;\r\n      }\r\n\r\n      .wrapper{\r\n        width: 100% !important;\r\n        max-width: 8.27in;\r\n        min-height: 100%;\r\n        position: relative;\r\n      }\r\n\r\n      .d-none {\r\n        display: none;\r\n      }\r\n\r\n      .d-block {\r\n        display: block;\r\n      }\r\n\r\n      .invoice-scroll footer {\r\n        padding: 0 24px;\r\n      }\r\n\r\n\t  .invoice-prev-block footer {\r\n        padding: 0 24px;\r\n      }\r\n    </style>\r\n  </head>\r\n\r\n  <body>\r\n    <div class="wrapper" style="width: 8.27in;margin-left: auto;margin-right: auto;">\r\n      <header class="d-none" id=\'header-div\'>\r\n        <table style="width: 100%;border-collapse: collapse;">\r\n          <tr>\r\n            <td style="text-align: left;vertical-align: bottom;">\r\n              <img src="[TenantLogo]"\r\n                style="max-width: 200px;max-height: 70px; display: inline-block;vertical-align: middle;" alt="">\r\n              <p\r\n                style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 7px;line-height: 11px;padding-bottom: 2px;white-space: nowrap;">\r\n                Invoice #[InvoiceNumber]</p>\r\n            </td>\r\n            <td style="text-align: right;vertical-align: bottom;">\r\n              <p\r\n                style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 7px;line-height: 11px;padding-bottom: 2px;white-space: nowrap;">\r\n                [CurrentDate]</p>\r\n              <p\r\n                style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 7px;line-height: 11px;padding-bottom: 2px;white-space: nowrap;">\r\n                Client #[ClientNumber]</p>\r\n              <p\r\n                style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 7px;line-height: 11px;padding-bottom: 2px;white-space: nowrap;">\r\n                Page #PAGENUMBER</p>\r\n            </td>\r\n          </tr>\r\n        </table>\r\n      </header>\r\n      <footer class="d-none " id=\'footer-div\'>\r\n        <div class="footer-inner">\r\n          <p\r\n          style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 7px;line-height: 11px;padding-bottom: 17px;">\r\n          [DisclaimerText]</p>\r\n        <div class=\'payment-instructions-text\'\r\n          style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 7px;line-height: 11px;padding-bottom: 17px;">\r\n          [PaymentInstructionText]\r\n        </div>\r\n        <p\r\n          style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 7px;line-height: 11px;font-weight: 700;">\r\n          Please include the Client, Matter, or Invoice Number with all payments. </p>\r\n        </div>\r\n      </footer>\r\n      <div class="card box-shadow" id=\'cover-page\'>\r\n        <div class="card-body">\r\n          <table\r\n            style="width: 100%;border-collapse: collapse;color: #353B4B;background: #fff; font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;">\r\n            <tr>\r\n              <td style="text-align: left;vertical-align: top;">\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td style="text-align: center;vertical-align: top;"> <img\r\n                        src="[TenantLogo]"\r\n                        style="max-width: 200px;max-height: 70px; display: inline-block;vertical-align: middle;" alt="">\r\n                    </td>\r\n                  </tr>\r\n                </table>\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td style="height: 13px;vertical-align: top;"></td>\r\n                  </tr>\r\n                </table>\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td\r\n                      style="vertical-align: top;text-align: center;color: #353B4B; font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;width: 65%;font-weight: 700;text-transform: uppercase;">\r\n                      EMPLOYER IDENTIFICATION NUMBER: [EIN]\r\n                    </td>\r\n                  </tr>\r\n                </table>\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td style="height: 16px;vertical-align: top;"></td>\r\n                  </tr>\r\n                </table>\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td style="text-align: left;vertical-align: top;">\r\n                      <table style="width: 100%;border-collapse: collapse;">\r\n                        <tr>\r\n                          <td\r\n                            style="padding-left: 10px; vertical-align: top;text-align: left;color: #353B4B; font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;width: 65%;padding-right: 20px;">\r\n                            [ClientName]\r\n                            <br> [Address1]\r\n                            <br> [Address2] <br>\r\n                            [City], [State] [Zip]\r\n                          </td>\r\n                          <td\r\n                            style="vertical-align: top;text-align: left;color: #353B4B; font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;width: 35%;">\r\n                            [CurrentDate]\r\n                            <br> Invoice #[InvoiceNumber]\r\n                            <br> Client #[ClientNumber]\r\n                            <br> Matter #[MatterNumber]\r\n                          </td>\r\n                        </tr>\r\n                      </table>\r\n                    </td>\r\n                  </tr>\r\n                </table>\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td style="height: 25px;vertical-align: top;"></td>\r\n                  </tr>\r\n                </table>\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td\r\n                      style="text-align: center;vertical-align: top;color: #353B4B; font-family: Arial, Helvetica, sans-serif; font-size: 10px;line-height: 12px;text-decoration: underline;font-weight: 700;">\r\n                      REMITTANCE ADVICE </td>\r\n                  </tr>\r\n                </table>\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td style="height: 13px;vertical-align: top;"></td>\r\n                  </tr>\r\n                </table>\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td\r\n                      style="text-align: left;vertical-align: top;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 10px;line-height: 12px;background-color: #F4F7F9;font-weight: 700;padding: 4px 10px;text-transform: uppercase;">\r\n                      BALANCE FORWARD</td>\r\n                  </tr>\r\n                </table>\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td\r\n                      style="text-align: left;vertical-align: top;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 10px;padding-left: 10px;padding-top: 4px;">\r\n                      Balance per Last Statement </td>\r\n                    <td\r\n                      style="text-align: right;vertical-align: top;color: #353B4B; font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 10px;padding-left: 10px;padding-top: 4px;white-space: nowrap;">\r\n                      $ [BalanceAmount]\r\n                    </td>\r\n                  </tr>\r\n                  <tr>\r\n                    <td\r\n                      style="text-align: left;vertical-align: top;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 10px;padding-left: 10px;">\r\n                      Payments and Other Credits </td>\r\n                    <td\r\n                      style="text-align: right;vertical-align: top;color: #353B4B; font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 10px;padding-left: 10px;white-space: nowrap;">\r\n                      $ [PaymentAmount]\r\n                    </td>\r\n                  </tr>\r\n                  <tr>\r\n                    <td\r\n                      style="text-align: left;vertical-align: top;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 10px;padding-left: 10px;font-weight: 700;">\r\n                      Balance Forward </td>\r\n                    <td\r\n                      style="text-align: right;vertical-align: middle;color: #353B4B; font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 10px;padding-left: 10px;font-weight: 700;white-space: nowrap;">\r\n                      $ [TotalBalance]\r\n                    </td>\r\n                  </tr>\r\n                </table>\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td style="height: 18px;vertical-align: top;"></td>\r\n                  </tr>\r\n                </table>\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td\r\n                      style="text-align: left;vertical-align: top;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 10px;line-height: 12px;background-color: #F4F7F9;font-weight: 700;padding: 4px 10px;text-transform: uppercase;">\r\n                      CURRENT CHARGES FOR MATTER</td>\r\n                  </tr>\r\n                </table>\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td\r\n                      style="text-align: left;vertical-align: top;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 10px;padding-left: 10px;padding-top: 4px;">\r\n                      Matter #[MatterNumber] </td>\r\n                  </tr>\r\n                  <tr>\r\n                    <td\r\n                      style="text-align: left;vertical-align: top;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 10px;padding-left: 10px;">\r\n                      [MatterName] </td>\r\n                  </tr>\r\n                </table>\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td\r\n                      style="text-align: right;vertical-align: top;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 8%;padding-left: 10px;width: 90%;padding-top: 4px;">\r\n                      Total Fees for Legal Service this bill </td>\r\n                    <td\r\n                      style="text-align: right;vertical-align: top;color: #353B4B; font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 10px;padding-left: 10px;white-space: nowrap;min-width: 125px;padding-top: 4px;">\r\n                      $ [TotalFees]\r\n                    </td>\r\n                  </tr>\r\n                  <tr>\r\n                    <td\r\n                      style="text-align: right;vertical-align: top;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 8%;padding-left: 10px;width: 90%;">\r\n                      Total Disbursements this bill </td>\r\n                    <td\r\n                      style="text-align: right;vertical-align: top;color: #353B4B; font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 10px;padding-left: 10px;white-space: nowrap;min-width: 125px;">\r\n                      $ [TotalDisbursements]\r\n\r\n                    </td>\r\n                  </tr>\r\n                  <tr>\r\n                    <td\r\n                      style="text-align: right;vertical-align: top;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 8%;padding-left: 10px;padding-bottom: 10px;width: 90%;padding-bottom: 6px;">\r\n                      Total this bill </td>\r\n                    <td\r\n                      style="text-align: right;vertical-align: top;color: #353B4B; font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 10px;padding-left: 10px;padding-bottom: 10px; white-space: nowrap;min-width: 125px;padding-bottom: 6px;">\r\n                      $ [TotalFeesAndDisbursements]\r\n                    </td>\r\n                  </tr>\r\n                  <tr>\r\n                    <td\r\n                      style="text-align: right;vertical-align: middle;color: #fff;font-family: Arial, Helvetica, sans-serif; font-size: 10px;line-height: 14px;padding-right: 8%;padding-left: 10px;width: 90%;font-weight: bold;background-color: #494949;text-transform: uppercase;">\r\n                      TOTAL CHARGES THIS INVOICE </td>\r\n                    <td\r\n                      style="text-align: right;vertical-align: middle;color: #fff; font-family: Arial, Helvetica, sans-serif; font-size: 10px;line-height: 14px;padding-right: 10px;padding-left: 10px;padding-top: 4px;padding-bottom: 4px; background-color: #494949;white-space: nowrap;font-weight: 700;min-width: 125px;">\r\n                      $ [TotalFeesAndDisbursements]\r\n\r\n                    </td>\r\n                  </tr>\r\n                  <tr>\r\n                    <td\r\n                      style="text-align: right;vertical-align: top;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 8%;padding-left: 10px;width: 90%;padding-top: 9px;">\r\n                      Statement Total Including Balance Forward</td>\r\n                    <td\r\n                      style="text-align: right;vertical-align: top;color: #353B4B; font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 10px;padding-left: 10px;white-space: nowrap;min-width: 125px;padding-top: 9px;">\r\n                      $ [Total]\r\n\r\n                    </td>\r\n                  </tr>\r\n                </table>\r\n\r\n                <div id=\'trust-accounting-section\'>\r\n                  <table style="width: 100%;border-collapse: collapse;">\r\n                    <tr>\r\n                      <td style="height: 18px;vertical-align: top;"></td>\r\n                    </tr>\r\n                  </table>\r\n                  <table style="width: 100%;border-collapse: collapse;">\r\n                    <tr>\r\n                      <td\r\n                        style="text-align: left;vertical-align: top;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 10px;line-height: 12px;background-color: #F4F7F9;font-weight: 700;padding: 4px 10px;text-transform: uppercase;">\r\n                        MONIES ON HAND</td>\r\n                    </tr>\r\n                  </table>\r\n                  <table style="width: 100%;border-collapse: collapse;">\r\n                    <tr>\r\n                      <td style="height: 4px;vertical-align: top;"></td>\r\n                    </tr>\r\n                  </table>\r\n                  <table style="width: 100%;border-collapse: collapse;">\r\n                    <tr>\r\n                      <td\r\n                        style="text-align: right;vertical-align: top;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 8%;padding-left: 10px;padding-top: 10px; width: 90%;">\r\n                        Primary Retainer Trust</td>\r\n                      <td\r\n                        style="text-align: right;vertical-align: top;color: #353B4B; font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 10px;padding-left: 10px;padding-top: 10px;white-space: nowrap;min-width: 125px;">\r\n                        $ [PrimaryRetainerTrustBalance]\r\n                      </td>\r\n                    </tr>\r\n                    <tr>\r\n                      <td\r\n                        style="text-align: right;vertical-align: top;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 8%;padding-left: 10px;width: 90%;">\r\n                        Total Trust on Hand</td>\r\n                      <td\r\n                        style="text-align: right;vertical-align: top;color: #353B4B; font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 10px;padding-left: 10px;white-space: nowrap;min-width: 125px;">\r\n                        $ [TotalTrustOnHand]\r\n\r\n                      </td>\r\n                    </tr>\r\n                    <tr>\r\n                      <td\r\n                        style="text-align: right;vertical-align: top;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 8%;padding-left: 10px;padding-bottom: 10px;width: 90%;font-weight: 700;">\r\n                        Total Monies on Hand</td>\r\n                      <td\r\n                        style="text-align: right;vertical-align: top;color: #353B4B; font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 10px;padding-left: 10px;padding-bottom: 10px; white-space: nowrap;font-weight: 700;border-top: 1px solid #353B4B;min-width: 125px;">\r\n                        $ [TotalMoniesOnHand]\r\n                      </td>\r\n                    </tr>\r\n                  </table>\r\n                </div>\r\n\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td style="height: 36px;vertical-align: top;"></td>\r\n                  </tr>\r\n                </table>\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td\r\n                      style="text-align: center;vertical-align: top;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 10px;line-height: 12px;text-decoration: underline;background-color: #F4F7F9;font-weight: 700;padding: 4px 10px;text-transform: uppercase;">\r\n                      <span\r\n                        style="display: inline-block;vertical-align: middle;text-decoration: underline;">DISCLAIMER</span>\r\n                    </td>\r\n                  </tr>\r\n                </table>\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td\r\n                      style="text-align: left;vertical-align: top;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 10px;padding-left: 10px;padding-top: 10px;padding-top: 4px;">\r\n                      [DisclaimerText]</td>\r\n                  </tr>\r\n                </table>\r\n\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td style="height: 18px;vertical-align: top;"></td>\r\n                  </tr>\r\n                </table>\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td\r\n                      style="text-align: center;vertical-align: top;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 10px;line-height: 12px;text-decoration: underline;background-color: #F4F7F9;font-weight: 700;padding: 4px 10px;text-transform: uppercase;">\r\n                      <span style="display: inline-block;vertical-align: middle;text-decoration: underline;">PAYMENT\r\n                        INSTRUCTIONS</span>\r\n                    </td>\r\n                  </tr>\r\n                </table>\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td\r\n                      style="text-align: left;vertical-align: top;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 10px;padding-left: 10px;padding-top: 10px;padding-top: 4px;">\r\n                      [PaymentInstructionText]</td>\r\n                  </tr>\r\n                </table>\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td style="height: 18px;vertical-align: top;"></td>\r\n                  </tr>\r\n                </table>\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td\r\n                      style="text-align: left;vertical-align: top;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 10px;padding-left: 10px;font-weight: 700;">\r\n                      Please include the Client, Matter, or Invoice Number with all payments.</td>\r\n                  </tr>\r\n                </table>\r\n              </td>\r\n            </tr>\r\n          </table>\r\n        </div>\r\n      </div>\r\n\r\n      <div class="card box-shadow" id=\'page-hourly-matter\'>\r\n        <div class="card-body">\r\n          <header>\r\n            <table style="width: 100%;border-collapse: collapse;">\r\n              <tr>\r\n                <td style="text-align: left;vertical-align: bottom;">\r\n                  <img src="[TenantLogo]"\r\n                    style="max-width: 200px;max-height: 70px; display: inline-block;vertical-align: middle;" alt="">\r\n                  <p\r\n                    style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 7px;line-height: 11px;padding-bottom: 2px;white-space: nowrap;">\r\n                    Invoice #[InvoiceNumber]</p>\r\n                </td>\r\n                <td style="text-align: right;vertical-align: bottom;">\r\n                  <p\r\n                    style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 7px;line-height: 11px;padding-bottom: 2px;white-space: nowrap;">\r\n                    [CurrentDate]</p>\r\n                  <p\r\n                    style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 7px;line-height: 11px;padding-bottom: 2px;white-space: nowrap;">\r\n                    Client #[ClientNumber]</p>\r\n                  <p\r\n                    style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 7px;line-height: 11px;padding-bottom: 2px;white-space: nowrap;">\r\n                    Page #[PageNumber]</p>\r\n                </td>\r\n              </tr>\r\n            </table>\r\n          </header>\r\n          <table\r\n            style="width: 100%;border-collapse: collapse;color: #353B4B;background: #fff; font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;">\r\n            <tr id=\'hourly-page-container\'>\r\n              <td style="text-align: left;vertical-align: top;">\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td style="padding: 18px 10px 10px;">\r\n                      <h4 style="margin: 0 0 4px;font-weight: 700;font-size: 9px;line-height: 12px;text-transform: uppercase;">LEGAL SERVICES RENDERED <span\r\n                          style="font-size: 7px;margin-left: 5px;font-weight: normal;text-transform: none;">through\r\n                          [LastTransactionDate]</span>\r\n                      </h4>\r\n                      <p\r\n                        style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;">\r\n                        Matter #[MatterNumber]</p>\r\n                      <p\r\n                        style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;">\r\n                        [MatterName]</p>\r\n                    </td>\r\n                  </tr>\r\n                  <tr>\r\n                    <td>\r\n                      <table class="hours-table hours-table-container" style="width: 100%;border-collapse: collapse;">\r\n                        <thead>\r\n                          <tr>\r\n                            <th class="dos-td">\r\n                              <div class="dis-table">\r\n                                <div class="dos-left">Date of Service</div>\r\n                                <div class="tkpr-td">Timekeeper</div>\r\n                              </div>\r\n                            </th>\r\n                            <th class="hr-td text-right">Hours</th>\r\n                            <th class="hrrt-td text-right">Hourly Rate</th>\r\n                            <th class="sbtl-td text-right">Subtotal</th>\r\n                          </tr>\r\n                        </thead>\r\n                        <tbody class="hours-table-body">\r\n                          <tr class="hours-table-row">\r\n                            <td>\r\n                              <div class="dis-table">\r\n                                <div class="dos-left">[DateService]</div>\r\n                                <div class="tkpr-td">[Lastname, Firstname]</div>\r\n                              </div>\r\n                              <p style="margin: 0;padding-top: 3px;">[BillingNarrative]</p>\r\n                            </td>\r\n                            <td class="text-right">[Hours]</td>\r\n                            <td class="text-right">$ [HourlyRate]</td>\r\n                            <td class="text-right">$ [HoursXRate]</td>\r\n                          </tr>\r\n                          <tr>\r\n                            <td>\r\n                              <div class="dis-table">\r\n                                <div class="dos-left">[DateService]</div>\r\n                                <div class="tkpr-td">[Lastname, Firstname]</div>\r\n                              </div>\r\n                              <p style="margin: 0;padding-top: 3px;">[BillingNarrative]</p>\r\n                            </td>\r\n                            <td class="text-right">[Hours]</td>\r\n                            <td class="text-right">$ [HourlyRate]</td>\r\n                            <td class="text-right">$ [HoursXRate]</td>\r\n                          </tr>\r\n                        </tbody>\r\n                        <tfoot>\r\n                          <tr>\r\n                            <td class="text-right" colspan="2">[TotalHours]</td>\r\n                            <td class="text-right">–</td>\r\n                            <td class="text-right">$ [TotalDollars]</td>\r\n                          </tr>\r\n                        </tfoot>\r\n                      </table>\r\n                    </td>\r\n                  </tr>\r\n                </table>\r\n              </td>\r\n            </tr>\r\n            <tr id=\'disbursement-page-container\'>\r\n              <td style="text-align: left;vertical-align: top;">\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td style="padding: 18px 10px 10px;">\r\n                      <h4 style="margin: 0 0 4px;font-weight: 700;font-size: 9px;line-height: 12px;text-transform: uppercase;">DISBURSEMENTS<span\r\n                          style="font-size: 7px;margin-left: 5px;font-weight: normal;text-transform: none;">through\r\n                          [LastTransactionDate]</span>\r\n                      </h4>\r\n                      <p\r\n                        style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;">\r\n                        Matter #[MatterNumber]</p>\r\n                      <p\r\n                        style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;">\r\n                        [MatterName]</p>\r\n                    </td>\r\n                  </tr>\r\n                  <tr>\r\n                    <td>\r\n                      <table class="hours-table dis-table-container" style="width: 100%;border-collapse: collapse;">\r\n                        <thead>\r\n                          <tr>\r\n                            <th class="dos-td">\r\n                              <div class="dis-table">\r\n                                <div class="dos-left">Date of Service</div>\r\n                              </div>\r\n                            </th>\r\n                            <th class="hr-td text-right">Quantity</th>\r\n                            <th class="hrrt-td text-right">Rate per Unit</th>\r\n                            <th class="sbtl-td text-right">Subtotal</th>\r\n                          </tr>\r\n                        </thead>\r\n                        <tbody class="dis-table-body">\r\n                          <tr class="dis-table-row">\r\n                            <td>\r\n                              <div class="dis-table">\r\n                                <div class="dos-left">[DateService]</div>\r\n                              </div>\r\n                              <p style="margin: 0;padding-top: 3px;">[BillingNarrative]</p>\r\n                            </td>\r\n                            <td class="text-right">[Quantity]</td>\r\n                            <td class="text-right">$ [FixedorAmount]</td>\r\n                            <td class="text-right">$ [QuantityXRPU]</td>\r\n                          </tr>\r\n                          <tr>\r\n                            <td>\r\n                              <div class="dis-table">\r\n                                <div class="dos-left">[DateService]</div>\r\n                              </div>\r\n                              <p style="margin: 0;padding-top: 3px;">[BillingNarrative]</p>\r\n                            </td>\r\n                            <td class="text-right">[Quantity]</td>\r\n                            <td class="text-right">$ [FixedorAmount]</td>\r\n                            <td class="text-right">$ [QuantityXRPU]</td>\r\n                          </tr>\r\n                        </tbody>\r\n                        <tfoot>\r\n                          <tr>\r\n                            <td class="text-right" colspan="2">[TotalQuantity]</td>\r\n                            <td class="text-right">–</td>\r\n                            <td class="text-right">$ [TotalDollars]</td>\r\n                          </tr>\r\n                        </tfoot>\r\n                      </table>\r\n                    </td>\r\n                  </tr>\r\n                </table>\r\n              </td>\r\n            </tr>\r\n          </table>\r\n          <footer>\r\n            <div class="footer-inner">\r\n              <p\r\n              style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 7px;line-height: 11px;padding-bottom: 17px;">\r\n              [DisclaimerText]</p>\r\n            <div class=\'payment-instructions-text\'\r\n              style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 7px;line-height: 11px;padding-bottom: 17px;">\r\n              [PaymentInstructionText]\r\n            </div>\r\n            <p\r\n              style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 7px;line-height: 11px;font-weight: 700;">\r\n              Please include the Client, Matter, or Invoice Number with all payments. </p>\r\n            </div>\r\n          </footer>\r\n        </div>\r\n      </div>\r\n\r\n      <div class="card box-shadow" id=\'page-fixed-fee-matter\'>\r\n        <div class="card-body">\r\n          <header>\r\n            <table style="width: 100%;border-collapse: collapse;">\r\n              <tr>\r\n                <td style="text-align: left;vertical-align: bottom;">\r\n                  <img src="[TenantLogo]"\r\n                    style="max-width: 200px;max-height: 70px; display: inline-block;vertical-align: middle;" alt="">\r\n                  <p\r\n                    style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 7px;line-height: 11px;padding-bottom: 2px;white-space: nowrap;">\r\n                    Invoice #[InvoiceNumber]</p>\r\n                </td>\r\n                <td style="text-align: right;vertical-align: bottom;">\r\n                  <p\r\n                    style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 7px;line-height: 11px;padding-bottom: 2px;white-space: nowrap;">\r\n                    [CurrentDate]</p>\r\n                  <p\r\n                    style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 7px;line-height: 11px;padding-bottom: 2px;white-space: nowrap;">\r\n                    Client #[ClientNumber]</p>\r\n                  <p\r\n                    style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 7px;line-height: 11px;padding-bottom: 2px;white-space: nowrap;">\r\n                    Page #[PageNumber]</p>\r\n                </td>\r\n              </tr>\r\n            </table>\r\n          </header>\r\n          <table\r\n            style="width: 100%;border-collapse: collapse;color: #353B4B;background: #fff; font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;">\r\n            <tr id=\'fixed-fee-page-container\'>\r\n              <td style="text-align: left;vertical-align: top;">\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td style="padding: 18px 10px 10px;">\r\n                      <h4 style="margin: 0 0 4px;font-weight: 700;font-size: 9px;line-height: 12px;text-transform: uppercase;">FIXED FEE SERVICES <span\r\n                          style="font-size: 7px;margin-left: 5px;font-weight: normal;text-transform: none;">through\r\n                          [LastTransactionDate]</span>\r\n                      </h4>\r\n                      <p\r\n                        style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;">\r\n                        Matter #[MatterNumber]</p>\r\n                      <p\r\n                        style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;">\r\n                        [MatterName]</p>\r\n                    </td>\r\n                  </tr>\r\n                  <tr>\r\n                    <td>\r\n                      <table class="hours-table fixed-fee-table-container" style="width: 100%;border-collapse: collapse;">\r\n                        <thead>\r\n                          <tr>\r\n                            <th class="dos-td">\r\n                              <div class="dis-table">\r\n                                <div class="dos-left">Date of Service</div>\r\n                                <div class="tkpr-td">Description</div>\r\n                              </div>\r\n                            </th>\r\n                            <th class="sbtl-td text-right">Subtotal</th>\r\n                          </tr>\r\n                        </thead>\r\n                        <tbody class="fixed-fee-body">\r\n                          <tr class="fixed-fee-row">\r\n                            <td style="width: 80%;">\r\n                              <div class="dis-table">\r\n                                <div class="dos-left">[DateService]</div>\r\n                                <div class="tkpr-td">[FixedFeeServiceDescription]</div>\r\n                              </div>\r\n                            </td>\r\n                            <td class="text-right">$ [ServiceAmount]</td>\r\n                          </tr>\r\n                          <tr>\r\n                            <td style="width: 80%;">\r\n                              <div class="dis-table">\r\n                                <div class="dos-left">[DateService]</div>\r\n                                <div class="tkpr-td">[FixedFeeServiceDescription]</div>\r\n                              </div>\r\n                            </td>\r\n                            <td class="text-right">$ [ServiceAmount]</td>\r\n                          </tr>\r\n                        </tbody>\r\n                        <tfoot>\r\n                          <tr>\r\n                            <td class="text-right">[Total]</td>\r\n                            <td class="text-right">$ [TotalDollars]</td>\r\n                          </tr>\r\n                        </tfoot>\r\n                      </table>\r\n                    </td>\r\n                  </tr>\r\n                </table>\r\n              </td>\r\n            </tr>\r\n            <tr id=\'disbursement-page-container\'>\r\n              <td style="text-align: left;vertical-align: top;">\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td style="padding: 18px 10px 10px;">\r\n                      <h4 style="margin: 0 0 4px;font-weight: 700;font-size: 9px;line-height: 12px;text-transform: uppercase;">DISBURSEMENTS<span\r\n                          style="font-size: 7px;margin-left: 5px;font-weight: normal;text-transform: none;">through\r\n                          [LastTransactionDate]</span>\r\n                      </h4>\r\n                      <p\r\n                        style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;">\r\n                        Matter #[MatterNumber]</p>\r\n                      <p\r\n                        style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;">\r\n                        [MatterName]</p>\r\n                    </td>\r\n                  </tr>\r\n                  <tr>\r\n                    <td>\r\n                      <table class="hours-table dis-table-container" style="width: 100%;border-collapse: collapse;">\r\n                        <thead>\r\n                          <tr>\r\n                            <th class="dos-td">\r\n                              <div class="dis-table">\r\n                                <div class="dos-left">Date of Service</div>\r\n                              </div>\r\n                            </th>\r\n                            <th class="hr-td text-right">Quantity</th>\r\n                            <th class="hrrt-td text-right">Rate per Unit</th>\r\n                            <th class="sbtl-td text-right">Subtotal</th>\r\n                          </tr>\r\n                        </thead>\r\n                        <tbody class="dis-table-body">\r\n                          <tr class="dis-table-row">\r\n                            <td>\r\n                              <div class="dis-table">\r\n                                <div class="dos-left">[DateService]</div>\r\n                              </div>\r\n                              <p style="margin: 0;padding-top: 3px;">[BillingNarrative]</p>\r\n                            </td>\r\n                            <td class="text-right">[Quantity]</td>\r\n                            <td class="text-right">$ [FixedorAmount]</td>\r\n                            <td class="text-right">$ [QuantityXRPU]</td>\r\n                          </tr>\r\n                          <tr>\r\n                            <td>\r\n                              <div class="dis-table">\r\n                                <div class="dos-left">[DateService]</div>\r\n                              </div>\r\n                              <p style="margin: 0;padding-top: 3px;">[BillingNarrative]</p>\r\n                            </td>\r\n                            <td class="text-right">[Quantity]</td>\r\n                            <td class="text-right">$ [FixedorAmount]</td>\r\n                            <td class="text-right">$ [QuantityXRPU]</td>\r\n                          </tr>\r\n                        </tbody>\r\n                        <tfoot>\r\n                          <tr>\r\n                            <td class="text-right" colspan="2">[TotalQuantity]</td>\r\n                            <td class="text-right">–</td>\r\n                            <td class="text-right">$ [TotalDollars]</td>\r\n                          </tr>\r\n                        </tfoot>\r\n                      </table>\r\n                    </td>\r\n                  </tr>\r\n                </table>\r\n              </td>\r\n            </tr>\r\n          </table>\r\n          <footer>\r\n            <div class="footer-inner">\r\n              <p\r\n              style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 7px;line-height: 11px;padding-bottom: 17px;">\r\n              [DisclaimerText]</p>\r\n            <div class=\'payment-instructions-text\'\r\n              style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 7px;line-height: 11px;padding-bottom: 17px;">\r\n              [PaymentInstructionText]\r\n            </div>\r\n            <p\r\n              style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 7px;line-height: 11px;font-weight: 700;">\r\n              Please include the Client, Matter, or Invoice Number with all payments. </p>\r\n            </div>\r\n          </footer>\r\n        </div>\r\n      </div>\r\n\r\n      <div class="card box-shadow" id=\'page-trust-accounting\'>\r\n        <div class="card-body">\r\n          <header>\r\n            <table style="width: 100%;border-collapse: collapse;">\r\n              <tr>\r\n                <td style="text-align: left;vertical-align: bottom;">\r\n                  <img src="[TenantLogo]"\r\n                    style="max-width: 200px;max-height: 70px; display: inline-block;vertical-align: middle;" alt="">\r\n                  <p\r\n                    style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 7px;line-height: 11px;padding-bottom: 2px;white-space: nowrap;">\r\n                    Invoice #[InvoiceNumber]</p>\r\n                </td>\r\n                <td style="text-align: right;vertical-align: bottom;">\r\n                  <p\r\n                    style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 7px;line-height: 11px;padding-bottom: 2px;white-space: nowrap;">\r\n                    [CurrentDate]</p>\r\n                  <p\r\n                    style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 7px;line-height: 11px;padding-bottom: 2px;white-space: nowrap;">\r\n                    Client #[ClientNumber]</p>\r\n                  <p\r\n                    style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 7px;line-height: 11px;padding-bottom: 2px;white-space: nowrap;">\r\n                    Page #[PageNumber]</p>\r\n                </td>\r\n              </tr>\r\n            </table>\r\n          </header>\r\n          <table\r\n            style="width: 100%;border-collapse: collapse;color: #353B4B;background: #fff; font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;">\r\n            <tr>\r\n              <td style="text-align: left;vertical-align: top;">\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td style="padding: 18px 10px 10px;">\r\n                      <h4 style="margin: 0 0 4px;font-weight: 700;font-size: 9px;line-height: 12px;text-transform: uppercase;">TRUST TRANSACTIONS <span\r\n                          style="font-size: 7px;margin-left: 5px;font-weight: normal;text-transform: none;">through\r\n                          [LastTransactionDate]</span>\r\n                      </h4>\r\n                      <p\r\n                        style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;">\r\n                        Matter #[MatterNumber]</p>\r\n                      <p\r\n                        style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;">\r\n                        [MatterName]\r\n                      </p>\r\n                    </td>\r\n                  </tr>\r\n                </table>\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td style="height: 18px;vertical-align: top;"></td>\r\n                  </tr>\r\n                </table>\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td\r\n                      style="text-align: left;vertical-align: top;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 10px;line-height: 12px;background-color: #F4F7F9;font-weight: 700;padding:4px 10px;text-transform: uppercase;">\r\n                      PRIMARY RETAINER TRUST</td>\r\n                  </tr>\r\n                </table>\r\n                <table style="width: 75%;border-collapse: collapse;" id=\'primary-retainer-trust-balance\'>\r\n                  <tr>\r\n                    <td\r\n                      style="text-align: left;vertical-align: top;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 10px;padding-left: 10px;padding-top: 4px;">\r\n                      Beginning Balance </td>\r\n                    <td\r\n                      style="text-align: right;vertical-align: top;color: #353B4B; font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 0;padding-left: 10px;padding-top: 4px;white-space: nowrap;">\r\n                      $ [BeginningBalance]\r\n                    </td>\r\n                  </tr>\r\n                  <tr>\r\n                    <td\r\n                      style="text-align: left;vertical-align: top;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 10px;padding-left: 10px;">\r\n                      Additions</td>\r\n                    <td\r\n                      style="text-align: right;vertical-align: top;color: #353B4B; font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 0;padding-left: 10px;white-space: nowrap;">\r\n                      $ [Additions]\r\n                    </td>\r\n                  </tr>\r\n                  <tr>\r\n                    <td\r\n                      style="text-align: left;vertical-align: top;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 10px;padding-left: 10px;">\r\n                      Withdrawals</td>\r\n                    <td\r\n                      style="text-align: right;vertical-align: top;color: #353B4B; font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 0;padding-left: 10px;white-space: nowrap;">\r\n                      $ [Withdrawals]\r\n                    </td>\r\n                  </tr>\r\n                  <tr>\r\n                    <td\r\n                      style="text-align: left;vertical-align: top;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 10px;padding-left: 10px;padding-bottom: 10px;font-weight: 700;">\r\n                      ENDING BALANCE as of [CurrentDate]</td>\r\n                    <td\r\n                      style="text-align: right;vertical-align: middle;color: #353B4B; font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 0;padding-left: 10px;padding-bottom: 10px;font-weight: 700;white-space: nowrap;border-top: 1px solid #353B4B;">\r\n                      $ [EndingBalance]\r\n                    </td>\r\n                  </tr>\r\n                </table>\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td style="height: 18px;vertical-align: top;"></td>\r\n                  </tr>\r\n                </table>\r\n                <table style="width: 100%;border-collapse: collapse;">\r\n                  <tr>\r\n                    <td\r\n                      style="text-align: left;vertical-align: top;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 10px;line-height: 12px;background-color: #F4F7F9;font-weight: 700;padding: 4px 10px;text-transform: uppercase;">\r\n                      TRUST ONLY</td>\r\n                  </tr>\r\n                </table>\r\n                <table style="width: 75%;border-collapse: collapse;" id=\'trust-only-balance\'>\r\n                  <tr>\r\n                    <td\r\n                      style="text-align: left;vertical-align: top;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 10px;padding-left: 10px;padding-top: 4px;">\r\n                      Beginning Balance </td>\r\n                    <td\r\n                      style="text-align: right;vertical-align: top;color: #353B4B; font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 0;padding-left: 10px;padding-top: 4px;white-space: nowrap;">\r\n                      $ [BeginningBalance]\r\n                    </td>\r\n                  </tr>\r\n                  <tr>\r\n                    <td\r\n                      style="text-align: left;vertical-align: top;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 10px;padding-left: 10px;">\r\n                      Additions</td>\r\n                    <td\r\n                      style="text-align: right;vertical-align: top;color: #353B4B; font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 0;padding-left: 10px;white-space: nowrap;">\r\n                      $ [Additions]\r\n                    </td>\r\n                  </tr>\r\n                  <tr>\r\n                    <td\r\n                      style="text-align: left;vertical-align: top;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 10px;padding-left: 10px;">\r\n                      Withdrawals</td>\r\n                    <td\r\n                      style="text-align: right;vertical-align: top;color: #353B4B; font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 0;padding-left: 10px;white-space: nowrap;">\r\n                      $ [Withdrawals]\r\n                    </td>\r\n                  </tr>\r\n                  <tr>\r\n                    <td\r\n                      style="text-align: left;vertical-align: top;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 10px;padding-left: 10px;padding-bottom: 10px;font-weight: 700;">\r\n                      ENDING BALANCE as of [CurrentDate]</td>\r\n                    <td\r\n                      style="text-align: right;vertical-align: middle;color: #353B4B; font-family: Arial, Helvetica, sans-serif; font-size: 8px;line-height: 13px;padding-right: 0;padding-left: 10px;padding-bottom: 10px;font-weight: 700;white-space: nowrap;border-top: 1px solid #353B4B;">\r\n                      $ [EndingBalance]\r\n                    </td>\r\n                  </tr>\r\n                </table>\r\n              </td>\r\n            </tr>\r\n          </table>\r\n          <footer>\r\n            <div class="footer-inner">\r\n              <p\r\n              style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 7px;line-height: 11px;padding-bottom: 17px;">\r\n              [DisclaimerText]</p>\r\n            <div class=\'payment-instructions-text\'\r\n              style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 7px;line-height: 11px;padding-bottom: 17px;">\r\n              [PaymentInstructionText]\r\n            </div>\r\n            <p\r\n              style="margin: 0;color: #353B4B;font-family: Arial, Helvetica, sans-serif; font-size: 7px;line-height: 11px;font-weight: 700;">\r\n              Please include the Client, Matter, or Invoice Number with all payments. </p>\r\n            </div>\r\n          </footer>\r\n        </div>\r\n      </div>\r\n    </div>\r\n  </body>\r\n\r\n  </html>\r\n',
    tenantId: 1006,
    isActive: true,
  },
};

const mockCustomConten = {
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiI3MTUyIiwiYWN0b3J0IjoiU2FjaGluIiwiYW1yIjoiTWhldHJlIiwiYXVkIjoiRW1wbG95ZWVARXZlcnlvbmVAYWRtaW5AQ29weSAtIDA3IG9jdC12a2phZ2F0IiwiYXpwIjoiMTAwNiIsImVtYWlsIjoic2FjaGlubUB5b3BtYWlsLmNvbSIsImZhbWlseV9uYW1lIjoiQWRtaW4iLCJnZW5kZXIiOiIiLCJUaWVyIjoiQXNjZW5kaW5nIiwiQ29ubmVjdGlvblN0cmluZyI6IkdWSnVQQk1kc0RhRzU1dXRwN005SmwxNzBWY2d3MHlvdFNhY0FEWW4vbG5LV0c2UHNEaHo4dno5N0ZQWnBscUJEWTZGUHY3MnlrY1oyNW1mbXMxdndHd05MRGtXcTBPYW52STB4U3RWd2NtUDh3eUY2MnZNZEptTjlkVHk5eTgrUTJTUFZpOVBNNjd4cG9zdmJHZUtyYVg4dE1Fc1JyOTBaLzBLemxmUjBiTT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiR1ZKdVBCTWRzRGFHNTV1dHA3TTlKbDE3MFZjZ3cweW90U2FjQURZbi9sbktXRzZQc0Roejh2ejk3RlBacGxxQkRZNkZQdjcyeWtjWjI1bWZtczF2d0d3TkxEa1dxME9hbnZJMHhTdFZ3Y21QOHd5RjYydk1kSm1OOWRUeTl5OCtRMlNQVmk5UE02N3hwb3N2YkdlS3JhWDh0TUVzUnI5MFovMEt6bGZSMGJNPSIsIm5iZiI6MTYxMDcwNDA5MywiZXhwIjoxNjEwNzQ3MjkzLCJpYXQiOjE2MTA3MDQwOTN9.t-MajJN7t0v-BP5nj-1mLwsdSaTl-ldsZKLSFUJTxdo',
  results: {
    id: 8,
    invoiceTemplateId: 24,
    tenantId: 1006,
    disclaimerText:
      'This is the sample Disclaimer text and it can be feed as custom 5',
    paymentText:
      '<p>This is payment instruction and it can be feed as custom 2content 11112111</p>',
    ein: '99-9495433422333431',
    isActive: true,
  },
};

const mockStatus = {
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiI3MTUyIiwiYWN0b3J0IjoiU2FjaGluIiwiYW1yIjoiTWhldHJlIiwiYXVkIjoiRW1wbG95ZWVARXZlcnlvbmVAYWRtaW5AQ29weSAtIDA3IG9jdC12a2phZ2F0IiwiYXpwIjoiMTAwNiIsImVtYWlsIjoic2FjaGlubUB5b3BtYWlsLmNvbSIsImZhbWlseV9uYW1lIjoiQWRtaW4iLCJnZW5kZXIiOiIiLCJUaWVyIjoiQXNjZW5kaW5nIiwiQ29ubmVjdGlvblN0cmluZyI6IkdWSnVQQk1kc0RhRzU1dXRwN005SmwxNzBWY2d3MHlvdFNhY0FEWW4vbG5LV0c2UHNEaHo4dno5N0ZQWnBscUJEWTZGUHY3MnlrY1oyNW1mbXMxdndHd05MRGtXcTBPYW52STB4U3RWd2NtUDh3eUY2MnZNZEptTjlkVHk5eTgrUTJTUFZpOVBNNjd4cG9zdmJHZUtyYVg4dE1Fc1JyOTBaLzBLemxmUjBiTT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiR1ZKdVBCTWRzRGFHNTV1dHA3TTlKbDE3MFZjZ3cweW90U2FjQURZbi9sbktXRzZQc0Roejh2ejk3RlBacGxxQkRZNkZQdjcyeWtjWjI1bWZtczF2d0d3TkxEa1dxME9hbnZJMHhTdFZ3Y21QOHd5RjYydk1kSm1OOWRUeTl5OCtRMlNQVmk5UE02N3hwb3N2YkdlS3JhWDh0TUVzUnI5MFovMEt6bGZSMGJNPSIsIm5iZiI6MTYxMDcwNDA5MywiZXhwIjoxNjEwNzQ3MjkzLCJpYXQiOjE2MTA3MDQwOTN9.t-MajJN7t0v-BP5nj-1mLwsdSaTl-ldsZKLSFUJTxdo',
  results: true,
};

@Injectable()
export class CustomAppConfigService {
  appConfig: IAppSettings = {
    API_URL: 'https://sc1-api.lexiconservices.com',
    SWAGGER_PATH: 'src/common/swagger-providers/',
    SWAGGER_SUB_PATH: '/swagger/v1/swagger.json',
    calendar_key: '0540678778-fcs-1578950738',
    brand: 'CPMG',
    cpmg_domain: 'https://sc1.lexiconservices.com',
    default_logo: 'assets/images/default-logo-lexicon.png',
    Common_Logout:
      'https://quarto-mta-common-dev-ui.azurewebsites.net/logout-b2c',
    Common_Login: 'https://quarto-mta-common-dev-ui.azurewebsites.net',
    Common_API: 'https://quarto-mta-common-dev-api.azurewebsites.net',
    intervalTime: 60000,
    timerSyncInterval: 15000,
  };

  APP_URL = `${window.location.protocol}//${window.location.host}`;
  valid_payment_methods = ['CASH', 'CHECK', 'E-CHECK', 'CREDIT_CARD'];
}

describe('CommonInvoicePdfComponent', () => {
  let component: CommonInvoicePdfComponent;
  let billingService: BillingService;
  let tenantService: TenantService;
  let trustAccountService: TrustAccountService;
  let fixture: ComponentFixture<CommonInvoicePdfComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        SharedModule,
        CommonModule,
        ApiModule.forRoot({
          rootUrl: 'https://sc1-api.lexiconservices.com',
        }),
        StoreModule.forRoot(reducers),
        ToastrModule.forRoot({}),
      ],
      providers: [
        CustomAppConfigService,
        {
          provide: AppConfigService,
          useClass: CustomAppConfigService,
        },
      ],
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(CommonInvoicePdfComponent);
        billingService = TestBed.get(BillingService);
        tenantService = TestBed.get(TenantService);
        trustAccountService = TestBed.get(TrustAccountService);
        component = fixture.componentInstance;
        component.loading = false;
        fixture.detectChanges();
      });
  }));

  it('should create', async () => {
    expect(component).toBeTruthy();
  });

  it('should hide trust accounting section if consultation invoice', async () => {
    component.invoiceId = 1;
    component.trustAccountEnabled = true;
    component.default_invoice = {
      invoiceTemplate: mockInvoiceTemplate.results,
      templateContent: mockCustomConten.results
    }

    spyOn(billingService, 'v1BillingInvoiceInvoiceIdGet').and.returnValue(
      of(JSON.stringify(mockInvoice)) as any
    );

    component.loadInvoiceInfo();

    fixture.detectChanges();

    expect(component.invoiceDetails).toBeDefined();
    expect(component.invoiceHTML).toBeDefined();

    if (component.invoiceHTML) {
      let trustAccountingSection = fixture.debugElement.query(
        By.css('#trust-accounting-section')
      );
      expect(trustAccountingSection).toBeTruthy();
      expect(trustAccountingSection.nativeElement).toBeTruthy();
      expect(trustAccountingSection.nativeElement.style.display).toBe('none');
    }
  });
});
