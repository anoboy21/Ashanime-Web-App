import React, { Fragment, useEffect, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, SelectorIcon } from "@heroicons/react/solid";
import {
  episodeSelected,
  fetchUserDataById,
  RootState,
  useAppDispatch,
  watchViewOpened,
} from "../../redux/store";
import { useSelector } from "react-redux";
import { episodes } from "../../types/type";
import { setStreamEpisode } from "../../redux/search-slice";
import { db } from "../../firebase/Firebase";
import { ref, set } from "firebase/database";
import { Buffer } from "buffer";
import { setStreamEpisodeObject } from "../../redux/videoState-slice";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function EpisodeDropdown(modalToggle: any) {
  const dispatch = useAppDispatch();
  const streamEpisode = useSelector(
    (state: RootState) => state.anime.streamEpisode
  );
  const episodesList = useSelector(
    (state: RootState) => state.anime.modalData.episodes
  );
  const modalData = useSelector((state: RootState) => state.anime.modalData);
  const savedEpisode = useSelector(
    (state: RootState) => state.videoState.savedEpisode
  );
  const savedProvider = useSelector(
    (state: RootState) => state.videoState.streamProvider
  );
  const savedEpisodes = useSelector(
    (state: RootState) => state.videoState.savedEpisodes
  );
  const streamEpisodeLinkObject = useSelector(
    (state: RootState) => state.videoState.streamEpisodeObject
  );
  const episodeSelectedDependency = useSelector(
    (state: RootState) => state.anime.episodeSelected
  );

  const uid = useSelector((state: any) => state.google.profileObject.uid);
  const provider = useSelector((state: any) => state.anime.provider);

  const [selected, setSelected] = useState<any>(savedEpisode);

  const encodeBase64 = (data: string) => {
    if (!data) return "undefined";
    return Buffer.from(data).toString("base64");
  };

  const currentAnimeTitleB64 = encodeBase64(modalData.title.romaji) as string;

  // fetch savedEpisodes from firebase
  useEffect(() => {
    dispatch(watchViewOpened(modalData));
    setSelected(streamEpisode);
  }, [modalToggle, streamEpisode, episodesList, selected]);

  useEffect(() => {
    dispatch(fetchUserDataById(uid));

    return () => {
      dispatch(
        setStreamEpisode({
          title: "",
          id: "",
          number: 0,
          image: "",
          description: "",
        })
      );
    };
  }, []);

  // TODO: add DUB to redux then here as a dependency
  //When the provider is changed, select the same episode number from the new provider
  useEffect(() => {
    const writeUserDataEpisode = (episode: any) => {
      set(ref(db, `users/${uid}/savedEpisodes/${currentAnimeTitleB64}`), {
        id: episode.id,
        number: episode.number,
      });
    };
    if (savedProvider) {
      const episode = episodesList.find(
        (episode: episodes) => episode.number === savedEpisode.number
      );
      if (episode) {
        setSelected(episode);
        writeUserDataEpisode(episode);
        dispatch(setStreamEpisode(episode));
        dispatch(setStreamEpisodeObject(episode));
        // if (
        //   savedProvider === "zoro" &&
        //   episode && //check if streamEpisode.id contains a $ character anywhere in the string and if it does not, dispatch the setStreamEpisode action
        //   !streamEpisode.id.includes("$")
        // ) {
        //   console.log("zoro");
        //   dispatch(setStreamEpisode(episode));
        //   dispatch(setStreamEpisodeObject(episode));
        // }
        // if (
        //   savedProvider === "gogo" &&
        //   episode && //check if streamEpisode.id contains a $ character anywhere in the string and if it does, dispatch the setStreamEpisode action
        //   streamEpisode.id.includes("$")
        // ) {
        //   console.log("gogo");
        //   dispatch(setStreamEpisode(episode));
        //   dispatch(setStreamEpisodeObject(episode));
        // }
      }
    }
  }, [
    currentAnimeTitleB64,
    dispatch,
    episodesList,
    savedEpisode.number,
    savedEpisode,
    savedProvider,
    uid,
  ]);

  // send the selected episode to the video player
  const handleOnChange = (selected: any) => {
    dispatch(
      episodeSelected({
        selectedEpisode: selected,
        modalData,
        uid: uid,
      })
    );
    setSelected(selected);
    dispatch(setStreamEpisodeObject(selected));
  };

  const lastEpisode = episodesList[episodesList.length - 1];

  return (
    <Listbox
      value={selected}
      //@ts-ignore
      by={"number"}
      onChange={(selected) => handleOnChange(selected)}
    >
      <div className="relative mt-1">
        <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
          <span className="block truncate">
            {selected.number > 0 ? selected.number : "Select Episode"}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <SelectorIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </span>
        </Listbox.Button>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute mt-1 max-h-60 w-24 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            <Listbox.Option
              key={0}
              value={lastEpisode?.id ? lastEpisode : "No episodes"}
              className={({ active }) =>
                classNames(
                  active ? "text-white bg-indigo-600" : "text-gray-900",
                  "cursor-default  select-none relative py-2 pl-3 pr-9 whitespace-nowrap"
                )
              }
            >
              {lastEpisode?.id ? "Last episode" : "No episodes"}
            </Listbox.Option>
            {episodesList &&
              [...episodesList].map((episode: episodes) => (
                <Listbox.Option
                  key={episode.id}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? "bg-redor text-white" : ""
                    }${
                      episode.isFiller
                        ? "bg-black text-white"
                        : "bg-white text-black"
                    }`
                  }
                  value={episode}
                >
                  {({ selected, active }) => (
                    <>
                      {episode.number === streamEpisode.number
                        ? selected
                        : !selected}
                      <span
                        key={episode.id}
                        className={`block truncate ${
                          selected || episode.number === streamEpisode.number
                            ? "font-medium"
                            : "font-normal"
                        }`}
                      >
                        {episode.number}
                      </span>
                      {selected || episode.number === streamEpisode.number ? (
                        <span
                          className={classNames(
                            active ? "text-white" : "text-redor",
                            `absolute inset-y-0 left-0 flex items-center pl-3`
                          )}
                        >
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
    // <Listbox
    //   value={selected ? selected : streamEpisode}
    //   onChange={(selected) => handleOnChange(selected)}
    // >
    //   {({ open }) => (
    //     <div className="flex">
    //       <div className="relative flex items-center w-full">
    //         <Listbox.Button className="bg-white w-full border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
    //           <p className="block truncate text-[12px] lg:text-[16px]">
    //             {streamEpisode.number || "Select episode"}
    //           </p>
    //           <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
    //             <SelectorIcon
    //               className="h-5 w-5 text-gray-400"
    //               aria-hidden="true"
    //             />
    //           </span>
    //         </Listbox.Button>
    //
    //         <Transition
    //           show={open}
    //           as={Fragment}
    //           leave="transition ease-in duration-100"
    //           leaveFrom="opacity-100"
    //           leaveTo="opacity-0"
    //         >
    //           <Listbox.Options className="absolute infinite  mt-1 w-28 bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
    //             <Listbox.Option
    //               key={0}
    //               value={lastEpisode?.id ? lastEpisode : "No episodes"}
    //               className={({ active }) =>
    //                 classNames(
    //                   active ? "text-white bg-indigo-600" : "text-gray-900",
    //                   "cursor-default  select-none relative py-2 pl-3 pr-9 whitespace-nowrap"
    //                 )
    //               }
    //             >
    //               {lastEpisode?.id ? "Last episode" : "No episodes"}
    //             </Listbox.Option>
    //             {episodesList &&
    //               [...episodesList].map((episode: episodes) => (
    //                 <Listbox.Option
    //                   key={episode.number}
    //                   className={({ active }) =>
    //                     classNames(
    //                       active ? "text-white bg-indigo-600" : "text-gray-900",
    //                       "cursor-default  select-none relative py-2 pl-3 pr-9"
    //                     )
    //                   }
    //                   value={episode}
    //                 >
    //                   {({ selected, active }) => (
    //                     <>
    //                       <span
    //                         className={classNames(
    //                           selected ? "font-semibold" : "font-normal",
    //                           "block truncate"
    //                         )}
    //                       >
    //                         {episode && episode.number}
    //                       </span>
    //
    //                       {selected ? (
    //                         <span
    //                           className={classNames(
    //                             active ? "text-white" : "text-indigo-600",
    //                             "absolute inset-y-0 right-0 flex items-center pr-4"
    //                           )}
    //                         >
    //                           <CheckIcon
    //                             className="h-5 w-5"
    //                             aria-hidden="true"
    //                           />
    //                         </span>
    //                       ) : null}
    //                     </>
    //                   )}
    //                 </Listbox.Option>
    //               ))}
    //           </Listbox.Options>
    //         </Transition>
    //       </div>
    //     </div>
    //   )}
    // </Listbox>
  );
}
