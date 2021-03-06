import * as React from 'react';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import {
  getAllListBoard,
  ICreateListPayload,
  onCreateNewList,
  onUpdateOrderList,
  onUpdateTittleList,
} from '../store/actions';
import './detail.style.less';
// @ts-ignore
import Board from 'react-trello';
import {
  selectAllList,
  selectBoardLoading,
  selectBoardSelected,
  selectGlobalLoading,
} from '../store/selector';
import { IBoardResponse, onGetListBoard } from 'pages/Board/store/reducer';
import { Lane } from 'pages/Board/dto/trello-board.class';
import io from 'socket.io-client';
import { BOARD_EMIT_EVENT, LIST_SUBSCRIBE_EVENT } from 'pages/Board/constants/board.socket-events';
import { List } from '../dto/list.class';
import { TrelloLoadingWrapper } from '../components/TrelloLoading';

const ENDPOINT = 'ws://localhost:4000/board';

interface IBoardParam {
  boardId: string;
}

const boardStyle = (boardSelected: IBoardResponse | null) => ({
  background: `url(${boardSelected?.urls.full}) center center no-repeat`,
});

const BoardDetailPage = () => {
  const { boardId }: IBoardParam = useParams();
  const dispatch = useDispatch();
  const allList = useSelector(selectAllList, shallowEqual);
  const boardLoading = useSelector(selectBoardLoading, shallowEqual);
  const globalLoading = useSelector(selectGlobalLoading, shallowEqual);
  const boardSelected = useSelector(selectBoardSelected, shallowEqual);

  const handleListSocket = () => {
    const socket = io(ENDPOINT);

    socket.on(LIST_SUBSCRIBE_EVENT.CONNECT, function () {
      socket.emit(BOARD_EMIT_EVENT.JOIN_BOARD, boardId);
    });

    socket.on(LIST_SUBSCRIBE_EVENT.CREATED_LIST, (newList: List) => {
      const newLane = new Lane(newList);
      const isExistList = allList.lanes.some(({ id }) => id === newLane.id);

      if (isExistList) return;

      dispatch(onGetListBoard({ ...allList, lanes: [...allList.lanes, newLane] }));
    });

    socket.on(LIST_SUBSCRIBE_EVENT.UPDATED_LIST, (listUpdate: List) => {
      const currentOrder = allList.lanes.findIndex(({ id }) => id === listUpdate._id);

      if (currentOrder !== listUpdate.order) return;

      dispatch(getAllListBoard(boardId, false));
    });

    return socket;
  };

  useEffect(() => {
    const socket = handleListSocket();

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    dispatch(getAllListBoard(boardId));
  }, [boardId]);

  const handleLaneDragEnd = (_: number, newOrder: number, payload: Lane): void => {
    dispatch(onUpdateOrderList({ newOrder, payload }));
  };

  const onLaneAdd = (params: ICreateListPayload) => {
    dispatch(onCreateNewList(params));
  };

  const onLaneUpdate = (laneId: string, data: { title: string }) => {
    dispatch(onUpdateTittleList({ laneId, name: data.title }));
  };

  return (
    <>
      <Board
        editable
        draggable
        canAddLanes
        editLaneTitle
        data={allList}
        hideCardDeleteIcon
        disallowAddingCard
        onLaneAdd={onLaneAdd}
        onLaneUpdate={onLaneUpdate}
        style={boardStyle(boardSelected)}
        handleLaneDragEnd={handleLaneDragEnd}
      />
      <TrelloLoadingWrapper visible={globalLoading} />
    </>
  );
};

export default React.memo(BoardDetailPage);
