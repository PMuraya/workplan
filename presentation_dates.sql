#Return all the days from one week from today in the past and future
with
    #
    #Get the last presentation date
    last_day as (
        select curdate() - interval 1 week as date 
    ),    
    #
    #Get the next 5 days (from the last day of presentation) excluding weekends
    next_dates as (
        with recursive next5 as (
            #
            #Set the initial date as the next date after the last date of a
            #he presentation
            select date as today from last_day
            
            # to the initial date, add the following (recursive) date
            union all

            #this is the recursive bit
            select
                #
                #Exclude weekends
                case 
                    #
                    #if the next day falls on a Sunday, we add 2 days to skip to Monday.
                    when dayofweek(today+interval 1 day) = 1 then today + interval 2 day 
                    #
                    #if the next date falls on a Saturday, we add 3 days to also skip to Monday.
                    when dayofweek(today + interval 1 day) = 7 then today + interval 3 day
                    #
                    #otherwise, we just add 1 day to move to the next weekday.
                    else today + interval 1 day
                end
            from
                next5
                join last_day
            where
                # go on, for as long as today is less than 5 days the next 5 days
                today < curdate() + interval 1 week
        )
        #List the 5 days
        select today from next5
    ),
    all_dates as (
        #
        #Select all presentation the dates
        select distinct date from presentation

        union all
        #
        #and add the next 5 days (without weekends)
        select * from next_dates
    )
select distinct date from all_dates order by date desc

