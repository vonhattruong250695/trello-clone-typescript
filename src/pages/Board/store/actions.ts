import { AppThunk } from 'redux/store';
import { AxiosResponse } from 'axios';
import axiosInstance from 'api/axios-config';
import { BOARD_ENDPOINT, LIST_ENDPOINT, UNSPLASH_ENDPOINT } from 'api/endpoint';
import {
  endBoardProcess,
  endGlobalProcessProcess,
  IUnsplashImage,
  onBoardSelected,
  onGetAllBoards,
  onGetListBoard,
  onUpdateTitleList,
  selectUnsplashImage,
  setAllUnsplashImageSuccess,
  startBoardProcess,
  startGlobalProcess,
  toggleBoardModal,
} from './reducer';
import {
  selectAllList,
  selectBoardSelected,
  selectUnsplashImageChoose,
} from 'pages/Board/store/selector';
import { HelperServices } from 'services/helper';
import { history } from 'redux/rootReducer';
import { PageEnum } from 'router/page.enum';
import { Lane, TrelloBoardResponse, TrelloCard } from 'pages/Board/dto/trello-board.class';
import { ListResponse } from '../dto/list.class';
import {
  ICardAdd,
  ICreateListPayload,
  IQueryImagePayload,
  IUpdateListPayload,
} from 'pages/Board/dto/board.dto';

export enum OrderBy {
  Latest = 'latest',
  Oldest = 'oldest',
  Popular = 'popular',
}

const helperService = new HelperServices();

export const getAllUnsplashImage = (queryPayload: IQueryImagePayload): AppThunk => async (
  dispatch,
  getState
) => {
  try {
    const { data }: AxiosResponse<Array<IUnsplashImage>> = await axiosInstance.get(
      UNSPLASH_ENDPOINT.GET_ALL,
      {
        params: { ...queryPayload, order_by: OrderBy.Latest },
      }
    );
    dispatch(setAllUnsplashImageSuccess(data));
    dispatch(selectUnsplashImage(data[0].urls));
  } catch (err) {}
};

export const createNewBoard = (name: string): AppThunk => async (dispatch, getState) => {
  try {
    dispatch(startBoardProcess());
    const urls = selectUnsplashImageChoose(getState());
    const payload = { name, urls };
    const { data: newBoard } = await axiosInstance.post(BOARD_ENDPOINT.CREATE_BOARD, payload);
    history.replace(
      helperService.placeParams(PageEnum.BOARD_DETAIL_PAGE, {
        boardId: newBoard._id,
      })
    );
    dispatch(toggleBoardModal(false));
  } catch (err) {
  } finally {
    await helperService.sleep(400);
    dispatch(endBoardProcess());
  }
};

export const getAllBoardOfUser = (userId: string): AppThunk => async (dispatch, getState) => {
  try {
    dispatch(startBoardProcess());
    const { data: allBoards } = await axiosInstance.get(BOARD_ENDPOINT.GET_BOARD_OF_USER(userId));
    dispatch(onGetAllBoards(allBoards));
  } catch (e) {
  } finally {
    await helperService.sleep(1000);
    dispatch(endBoardProcess());
  }
};

export const getAllListBoard = (boardId: string, isLoading: boolean = true): AppThunk => async (
  dispatch,
  getState
) => {
  try {
    if (isLoading) {
      dispatch(startGlobalProcess());
    }
    const { data: listData }: AxiosResponse<ListResponse> = await axiosInstance.get(
      LIST_ENDPOINT.GET_ALL(boardId)
    );
    const listPayload = new TrelloBoardResponse(listData);
    dispatch(onBoardSelected(listData.board));
    dispatch(onGetListBoard(listPayload));
  } catch (e) {
  } finally {
    await helperService.sleep(1000);
    dispatch(endGlobalProcessProcess());
  }
};

export const onUpdateOrderList = (updateListPayload: IUpdateListPayload): AppThunk => async (
  dispatch,
  getState
) => {
  console.log('updateListPayload', updateListPayload);
  try {
    dispatch(startBoardProcess());
    await axiosInstance.put(LIST_ENDPOINT.ON_UPDATE_LIST(updateListPayload.payload.id), {
      order: updateListPayload.newOrder,
    });
    await helperService.sleep(200);
    const boardSelected = selectBoardSelected(getState());
    dispatch(getAllListBoard(boardSelected?._id || '', false));
  } catch (e) {
  } finally {
    dispatch(endBoardProcess());
  }
};

export interface IUpdateTittleListPayload {
  laneId: string;
  name: string;
}

export const onUpdateTittleList = (updatePayload: IUpdateTittleListPayload): AppThunk => async (
  dispatch,
  getState
) => {
  try {
    dispatch(startBoardProcess());
    await axiosInstance.put(LIST_ENDPOINT.ON_UPDATE_LIST(updatePayload.laneId), {
      name: updatePayload.name,
    });
    dispatch(onUpdateTitleList(updatePayload));
  } catch (e) {
  } finally {
    dispatch(endBoardProcess());
  }
};

export const onCreateNewList = (createListPayload: ICreateListPayload): AppThunk => async (
  dispatch,
  getState
) => {
  try {
    const boardSelected = selectBoardSelected(getState());
    const currentList = selectAllList(getState());
    dispatch(startBoardProcess());

    const requestPayload = {
      boardId: boardSelected?._id,
      name: createListPayload.title,
    };
    const { data: listCreated } = await axiosInstance.post(
      LIST_ENDPOINT.CREATE_LIST,
      requestPayload
    );

    dispatch(
      onGetListBoard({
        ...currentList,
        lanes: [...currentList.lanes, new Lane(listCreated)],
      })
    );
  } catch (e) {
  } finally {
    dispatch(endBoardProcess());
  }
};

export const onCreateNewCard = (newCardPayload: ICardAdd): AppThunk => async (
  dispatch,
  getState
) => {};
