import { app } from 'electron';
import { join } from 'path';

// Steamworks SDK 타입 정의
interface SteamAPI {
  Init(): boolean;
  Shutdown(): void;
  RunCallbacks(): void;
  GetAppID(): number;
  GetSteamID(): string;
  GetPersonaName(): string;
  GetCurrentGameLanguage(): string;
  GetAvailableGameLanguages(): string;
  IsSubscribed(): boolean;
  IsSubscribedApp(appId: number): boolean;
  IsDlcInstalled(appId: number): boolean;
  GetEarliestPurchaseUnixTime(appId: number): number;
  IsSubscribedFromFreeWeekend(): boolean;
  GetDLCCount(): number;
  BIsDlcInstalled(appId: number): boolean;
  GetDlcDownloadProgress(appId: number): { bytesDownloaded: number; bytesTotal: number };
  InstallDLC(appId: number): void;
  UninstallDLC(appId: number): void;
  RequestAppProofOfPurchaseKey(appId: number): void;
  GetCurrentBetaName(): string;
  MarkContentCorrupt(missingFilesOnly: boolean): boolean;
  GetInstalledDepots(appId: number): number[];
  GetAppInstallDir(appId: number): string;
  IsAppInstalled(appId: number): boolean;
  GetAppOwner(): string;
  GetLaunchQueryParam(key: string): string;
  GetDlcCount(): number;
  GetDlcByIndex(dlcIndex: number): number;
  GetAppBuildId(): number;
  RequestAllProofOfPurchaseKeys(): void;
  GetFileDetails(filename: string): void;
  GetLaunchCommandLine(): string;
  IsSubscribedApp(appId: number): boolean;
  IsDlcInstalled(appId: number): boolean;
  GetEarliestPurchaseUnixTime(appId: number): number;
  IsSubscribedFromFreeWeekend(): boolean;
  GetDLCCount(): number;
  BIsDlcInstalled(appId: number): boolean;
  GetDlcDownloadProgress(appId: number): { bytesDownloaded: number; bytesTotal: number };
  InstallDLC(appId: number): void;
  UninstallDLC(appId: number): void;
  RequestAppProofOfPurchaseKey(appId: number): void;
  GetCurrentBetaName(): string;
  MarkContentCorrupt(missingFilesOnly: boolean): boolean;
  GetInstalledDepots(appId: number): number[];
  GetAppInstallDir(appId: number): string;
  IsAppInstalled(appId: number): boolean;
  GetAppOwner(): string;
  GetLaunchQueryParam(key: string): string;
  GetDlcCount(): number;
  GetDlcByIndex(dlcIndex: number): number;
  GetAppBuildId(): number;
  RequestAllProofOfPurchaseKeys(): void;
  GetFileDetails(filename: string): void;
  GetLaunchCommandLine(): string;
}

interface SteamUserStats {
  RequestCurrentStats(): boolean;
  GetStat(statName: string): number;
  GetStatFloat(statName: string): number;
  SetStat(statName: string, value: number): boolean;
  SetStatFloat(statName: string, value: number): boolean;
  UpdateAvgRateStat(statName: string, countThisSession: number, sessionLength: number): boolean;
  GetAchievement(achievementName: string): boolean;
  SetAchievement(achievementName: string): boolean;
  ClearAchievement(achievementName: string): boolean;
  GetNumAchievements(): number;
  GetAchievementName(achievementIndex: number): string;
  StoreStats(): boolean;
  ResetAllStats(achievementsToo: boolean): boolean;
  FindOrCreateLeaderboard(leaderboardName: string, sortMethod: number, displayType: number): void;
  FindLeaderboard(leaderboardName: string): void;
  GetLeaderboardName(leaderboard: any): string;
  GetLeaderboardEntryCount(leaderboard: any): number;
  GetLeaderboardSortMethod(leaderboard: any): number;
  GetLeaderboardDisplayType(leaderboard: any): number;
  DownloadLeaderboardEntries(leaderboard: any, dataRequest: number, rangeStart: number, rangeEnd: number): void;
  DownloadLeaderboardEntriesForUsers(leaderboard: any, users: any[], userCount: number): void;
  GetDownloadedLeaderboardEntry(leaderboardEntries: any, index: number, details: any, detailsMax: number): boolean;
  UploadLeaderboardScore(leaderboard: any, scoreMethod: number, score: number, details: number[]): void;
  AttachLeaderboardUGC(leaderboard: any, ugc: any): void;
  GetNumberOfCurrentPlayers(): void;
  RequestGlobalAchievementPercentages(): void;
  GetMostAchievedAchievementInfo(name: string, percent: number, achieved: boolean): number;
  GetNextMostAchievedAchievementInfo(iterator: number, name: string, percent: number, achieved: boolean): number;
  GetAchievementAchievedPercent(achievementName: string): number;
  RequestGlobalStats(days: number): void;
  GetGlobalStat(statName: string): number;
  GetGlobalStatFloat(statName: string): number;
  GetGlobalStatHistory(statName: string, data: number[], dataSize: number): number;
  GetGlobalStatHistoryFloat(statName: string, data: number[], dataSize: number): number;
}

interface SteamFriends {
  GetPersonaName(): string;
  SetPersonaName(name: string): void;
  GetPersonaState(): number;
  GetFriendCount(flags: number): number;
  GetFriendByIndex(index: number, flags: number): string;
  GetFriendRelationship(steamID: string): number;
  GetFriendPersonaState(steamID: string): number;
  GetFriendPersonaName(steamID: string): string;
  GetFriendGamePlayed(steamID: string): { gameID: number; gameIP: number; gamePort: number; queryPort: number; lobbySteamID: string };
  GetFriendPersonaNameHistory(steamID: string, personaName: number): string;
  HasFriend(steamID: string, flags: number): boolean;
  GetClanCount(): number;
  GetClanByIndex(index: number): string;
  GetClanName(steamID: string): string;
  GetClanTag(steamID: string): string;
  GetClanActivityCounts(steamID: string): { online: number; inGame: number; chatting: number };
  DownloadClanActivityCounts(steamIDs: string[], steamIDsCount: number): boolean;
  GetFriendCountFromSource(steamID: string): number;
  GetFriendFromSourceByIndex(steamID: string, index: number): string;
  IsUserInSource(steamID: string, sourceID: string): boolean;
  SetInGameVoiceSpeaking(steamID: string, speaking: boolean): void;
  ActivateGameOverlay(friend: string): void;
  ActivateGameOverlayToUser(action: string, steamID: string): void;
  ActivateGameOverlayToWebPage(url: string): void;
  ActivateGameOverlayToStore(appID: number, flag: number): void;
  SetPlayedWith(steamID: string): void;
  ActivateGameOverlayInviteDialog(steamID: string): void;
  GetSmallFriendAvatar(steamID: string): number;
  GetMediumFriendAvatar(steamID: string): number;
  GetLargeFriendAvatar(steamID: string): number;
  RequestUserInformation(steamID: string, requireNameOnly: boolean): boolean;
  RequestClanOfficerList(steamID: string): void;
  GetClanOwner(steamID: string): string;
  GetClanOfficerCount(steamID: string): number;
  GetClanOfficerByIndex(steamID: string, officer: number): string;
  GetUserRestrictions(): number;
  SetRichPresence(key: string, value: string): boolean;
  ClearRichPresence(): void;
  GetFriendRichPresence(steamID: string, key: string): string;
  GetFriendRichPresenceKeyCount(steamID: string): number;
  GetFriendRichPresenceKeyByIndex(steamID: string, key: number): string;
  RequestFriendRichPresence(steamID: string): void;
  InviteUserToGame(steamID: string, connectString: string): boolean;
  GetCoplayFriendCount(): number;
  GetCoplayFriend(coplayFriend: number): string;
  GetFriendCoplayTime(steamID: string): number;
  GetFriendCoplayGame(steamID: string): number;
  JoinClanChatRoom(steamID: string): void;
  LeaveClanChatRoom(steamID: string): boolean;
  GetClanChatMemberCount(steamID: string): number;
  GetChatMemberByIndex(steamID: string, user: number): string;
  SendClanChatMessage(steamID: string, text: string): boolean;
  GetClanChatMessage(steamID: string, message: number, text: string, textMax: number, type: number, steamIDChatter: string): number;
  IsClanChatAdmin(steamID: string, steamIDChatter: string): boolean;
  IsClanChatWindowOpenInSteam(steamID: string): boolean;
  OpenClanChatWindowInSteam(steamID: string): boolean;
  CloseClanChatWindowInSteam(steamID: string): boolean;
  SetListenForFriendsMessages(interceptEnabled: boolean): boolean;
  ReplyToFriendMessage(steamID: string, msgToSend: string): boolean;
  GetFriendMessage(steamID: string, messageID: number, text: string, textMax: number, type: number): number;
  GetFollowerCount(steamID: string): void;
  IsFollowing(steamID: string): void;
  EnumerateFollowingList(startIndex: number): void;
  IsClanPublic(steamID: string): boolean;
  IsClanOfficialGameGroup(steamID: string): boolean;
  GetNumChatsWithUnreadPriorityMessages(): number;
  ActivateGameOverlayRemotePlayTogetherInviteDialog(steamID: string): void;
  RegisterProtocolInOverlayBrowser(protocol: string): boolean;
  ActivateGameOverlayInviteDialogConnectString(connectString: string): void;
}

export class SteamIntegration {
  private steamAPI: SteamAPI | null = null;
  private steamUserStats: SteamUserStats | null = null;
  private steamFriends: SteamFriends | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeSteam();
  }

  private async initializeSteam() {
    try {
      // Steamworks SDK 로드 (실제 구현에서는 Steamworks SDK 필요)
      // this.steamAPI = require('steamworks.js');
      
      if (this.steamAPI && this.steamAPI.Init()) {
        this.isInitialized = true;
        console.log('✅ Steam API 초기화 성공');
        this.setupSteamCallbacks();
      } else {
        console.log('⚠️ Steam API 초기화 실패 - Steam 클라이언트가 실행되지 않았거나 게임이 Steam에서 실행되지 않음');
      }
    } catch (error) {
      console.error('❌ Steam API 초기화 오류:', error);
    }
  }

  private setupSteamCallbacks() {
    if (!this.isInitialized) return;

    // Steam 콜백 설정
    setInterval(() => {
      if (this.steamAPI) {
        this.steamAPI.RunCallbacks();
      }
    }, 100);
  }

  // Steam 통계 업데이트
  public updateStat(statName: string, value: number): boolean {
    if (!this.isInitialized || !this.steamUserStats) return false;
    
    try {
      return this.steamUserStats.SetStat(statName, value);
    } catch (error) {
      console.error('Steam 통계 업데이트 실패:', error);
      return false;
    }
  }

  // Steam 업적 해금
  public unlockAchievement(achievementName: string): boolean {
    if (!this.isInitialized || !this.steamUserStats) return false;
    
    try {
      return this.steamUserStats.SetAchievement(achievementName);
    } catch (error) {
      console.error('Steam 업적 해금 실패:', error);
      return false;
    }
  }

  // Steam 오버레이 활성화
  public activateOverlay(): void {
    if (!this.isInitialized || !this.steamFriends) return;
    
    try {
      this.steamFriends.ActivateGameOverlay('');
    } catch (error) {
      console.error('Steam 오버레이 활성화 실패:', error);
    }
  }

  // Steam Rich Presence 설정
  public setRichPresence(key: string, value: string): boolean {
    if (!this.isInitialized || !this.steamFriends) return false;
    
    try {
      return this.steamFriends.SetRichPresence(key, value);
    } catch (error) {
      console.error('Steam Rich Presence 설정 실패:', error);
      return false;
    }
  }

  // Steam 종료
  public shutdown(): void {
    if (this.isInitialized && this.steamAPI) {
      this.steamAPI.Shutdown();
      this.isInitialized = false;
    }
  }

  // Steam 초기화 상태 확인
  public isSteamInitialized(): boolean {
    return this.isInitialized;
  }

  // Steam 사용자 정보 가져오기
  public getSteamUserInfo(): { name: string; steamID: string; language: string } | null {
    if (!this.isInitialized || !this.steamAPI) return null;
    
    try {
      return {
        name: this.steamAPI.GetPersonaName(),
        steamID: this.steamAPI.GetSteamID(),
        language: this.steamAPI.GetCurrentGameLanguage()
      };
    } catch (error) {
      console.error('Steam 사용자 정보 가져오기 실패:', error);
      return null;
    }
  }
} 