import { ShipmentService } from "@/services/ShipmentService";
import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import ShipmentState from './ShipmentState'
import * as types from './mutation-types'
import { hasError, showToast } from '@/utils'
import { translate } from '@/i18n'
import emitter from '@/event-bus'

const actions: ActionTree<ShipmentState, RootState> = {
  async findShipment ({ commit, state }, payload) {
    let resp;
    try {
      resp = await ShipmentService.fetchShipments(payload)
      if (resp.status === 200 && resp.data.count> 0 && !hasError(resp)) {
        let shipments = resp.data.docs;
        if (payload.viewIndex && payload.viewIndex > 0) shipments = state.shipments.list.concat(shipments)
        commit(types.SHIPMENT_LIST_UPDATED, { shipments })
      } else {
        showToast(translate("Product not found"));
      }
      if (payload.viewIndex === 0) emitter.emit("dismissLoader");
    } catch(error){
      console.log(error)
      showToast(translate("Something went wrong"));
    }
    return resp;
  },
  async setCurrent ({ commit }, payload) {
    let resp;
    try {
      resp = await ShipmentService.getShipmentDetail(payload);
      if (resp.status === 200 && resp.data.items&& !hasError(resp)) {
        commit(types.SHIPMENT_CURRENT_UPDATED, { current: resp.data })
        return resp.data;
      } else {
        showToast(translate('Something went wrong'));
        console.error("error", resp.data._ERROR_MESSAGE_);
        return Promise.reject(new Error(resp.data._ERROR_MESSAGE_));
      }

    } catch (err) {
      showToast(translate('Something went wrong'));
      console.error("error", err);
      return Promise.reject(new Error(err))
    }
  },
  async updateShipmentProducts({ commit }, payload) {
    emitter.emit("presentLoader");
    let resp;
    try {
      resp = await ShipmentService.receiveShipmentItem(payload);
      if (resp.status == 200 && !hasError(resp)) {
        showToast(translate("Shipment Received Successfully") + ' ' + payload.shipmentId)
        await ShipmentService.updateShipment({
          "shipmentId": payload.shipmentId,
          "statusId": "PURCH_SHIP_RECEIVED"
        })
        commit(types.SHIPMENT_REMOVE_FROM_SHPMT_PRDTS, {shipmentId: payload.shipmentId});
      } else {
        showToast(translate("Something went wrong"))
      }
      emitter.emit("dismissLoader");
    } catch (error) {
      console.log(error);
      showToast(translate("Something went wrong"));
    } 
    return resp;
  }
}

export default actions;