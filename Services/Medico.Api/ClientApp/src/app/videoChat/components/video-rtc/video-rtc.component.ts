import { Component, OnInit } from '@angular/core';
import { RtcSignalRService, UserConnection } from '../../services/video-chat.service';

@Component({
  selector: 'video-chat',
  templateUrl: './video-rtc.component.html',
})
export class VideoRTCComponent implements OnInit {
  userName = '';
  users: Nullable<UserConnection[]>;

  joined = false;

  roomName = 'Test1';

  constructor(public rtcService: RtcSignalRService) {
    rtcService.usersObservable.subscribe(users => {
      this.users = users;
    });
  }

  ngOnInit() {}

  connect() {
    this.rtcService.join(this.userName, this.roomName);
    this.joined = true;
  }

  disconnect() {
    this.rtcService.disconnect();
    this.joined = false;
  }

  trackByFn(_index: number, user: UserConnection) {
    return user.user.connectionId;
  }
}
